import { injectable, singleton } from 'tsyringe';
import { Logger } from 'winston';
import { winstonLogger } from '@emrecolak-23/jobber-share';
import { EnvConfig } from '@notification-service/configs';
import { createClient, RedisClientType } from 'redis';

@singleton()
@injectable()
export class Redis {
  private log: Logger;
  private client: RedisClientType;
  private connectionPromise: Promise<void> | null = null;

  constructor(private readonly config: EnvConfig) {
    this.log = winstonLogger(this.config.ELASTIC_SEARCH_URL ?? 'redis', 'notificationServiceRedis', 'debug');

    this.client = createClient({
      url: this.config.REDIS_HOST,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 3000)
      }
    });

    this.setupEventHandlers();
  }

  get redisClient(): RedisClientType {
    return this.client;
  }

  private setupEventHandlers(): void {
    this.client.on('error', (error) => this.log.error('Redis error:', error));
    this.client.on('connect', () => this.log.info('Redis connecting...'));
    this.client.on('ready', () => this.log.info('Redis ready'));
    this.client.on('reconnecting', () => this.log.warn('Redis reconnecting...'));
    this.client.on('end', () => this.log.warn('Redis connection ended'));
  }

  public async connect(): Promise<void> {
    if (this.client.isReady) return;

    if (!this.connectionPromise) {
      this.connectionPromise = this.client
        .connect()
        .then(() => {
          this.log.info(`Redis connected: ${this.client.isReady}`);
          return;
        })
        .catch((error) => {
          this.connectionPromise = null;
          throw error;
        });
    }

    await this.connectionPromise;
  }

  private async ensureConnected(): Promise<boolean> {
    if (this.client.isReady) return true;

    try {
      await this.connect();
      return this.client.isReady;
    } catch {
      return false;
    }
  }

  public async executeCommand<T>(command: () => Promise<T>): Promise<T | null> {
    try {
      const isReady = await this.ensureConnected();

      if (!isReady) {
        this.log.error('Redis not ready, command skipped');
        return null;
      }

      return await command();
    } catch (error) {
      this.log.error('Redis command error:', error);
      return null;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.executeCommand(() => this.client.get(key));
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    const result = await this.executeCommand(() => (ttlSeconds ? this.client.setEx(key, ttlSeconds, value) : this.client.set(key, value)));
    return result !== null;
  }

  async del(key: string): Promise<boolean> {
    const result = await this.executeCommand(() => this.client.del(key));
    return result !== null && result > 0;
  }

  async disconnect(): Promise<void> {
    if (this.client.isReady) {
      await this.client.quit();
      this.connectionPromise = null;
    }
  }
}
