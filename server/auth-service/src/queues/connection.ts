import { EnvConfig } from '@auth-service/configs';
import { Logger } from 'winston';
import { winstonLogger } from '@emrecolak-23/jobber-share';
import client, { Channel, ConfirmChannel, ChannelModel } from 'amqplib';
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class QueueConnection {
  private readonly log: Logger = winstonLogger(`${this.config.ELASTIC_SEARCH_URL}`, 'authQueueConnection', 'debug');
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private confirmChannel: ConfirmChannel | null = null;
  private isConnecting: boolean = false;
  private isSigintHandlerSet: boolean = false;

  private readonly RETRY_DELAY = 5000;
  private readonly MAX_RETRIES = 10;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  constructor(private readonly config: EnvConfig) {}

  async getChannel(): Promise<Channel> {
    await this.ensureConnection();

    if (!this.channel) {
      this.channel = await this.connection!.createChannel();
      this.setupChannelEvents(this.channel, 'Channel');
      this.log.info('Channel created');
    }

    return this.channel;
  }

  async getConfirmChannel(): Promise<ConfirmChannel> {
    await this.ensureConnection();

    if (!this.confirmChannel) {
      this.confirmChannel = await this.connection!.createConfirmChannel();
      this.setupChannelEvents(this.confirmChannel, 'ConfirmChannel');
      this.log.info('ConfirmChannel created');
    }

    return this.confirmChannel;
  }

  private async ensureConnection(): Promise<void> {
    if (this.connection) {
      return;
    }

    if (this.isConnecting) {
      await this.waitForConnection();
      return;
    }

    this.isConnecting = true;

    try {
      this.connection = await this.createConnection();
      this.setupConnectionEvents();
      this.handleCloseOnSigint();
      this.log.info('RabbitMQ connection established');
    } catch (error) {
      this.log.error('RabbitMQ connection failed:', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  private async createConnection(retryCount: number = 0): Promise<ChannelModel> {
    try {
      return await client.connect(this.config.RABBITMQ_ENDPOINT);
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        this.log.warn(`Connection failed, retrying in ${this.RETRY_DELAY}ms... (${retryCount + 1}/${this.MAX_RETRIES})`);
        await this.delay(this.RETRY_DELAY);
        return this.createConnection(retryCount + 1);
      }
      throw error;
    }
  }

  private setupConnectionEvents(): void {
    if (!this.connection) {
      return;
    }

    this.connection.on('close', async (err) => {
      this.log.warn('RabbitMQ connection closed', err);
      this.resetAll();
      await this.reconnect();
    });

    this.connection.on('error', (err) => {
      this.log.error('RabbitMQ connection error:', err);
    });

    this.connection.on('blocked', (reason) => {
      this.log.warn('RabbitMQ connection blocked:', reason);
    });

    this.connection.on('unblocked', () => {
      this.log.info('RabbitMQ connection unblocked');
    });
  }

  private setupChannelEvents(channel: Channel | ConfirmChannel, name: 'Channel' | 'ConfirmChannel'): void {
    const eventEmitter = channel as NodeJS.EventEmitter;

    eventEmitter.on('error', (err) => {
      this.log.error(`${name} error:`, err);
      if (name === 'Channel') {
        this.channel = null;
      } else {
        this.confirmChannel = null;
      }
    });

    eventEmitter.on('close', () => {
      this.log.warn(`${name} closed`);
      if (name === 'Channel') {
        this.channel = null;
      } else {
        this.confirmChannel = null;
      }
    });
  }

  private resetAll(): void {
    this.channel = null;
    this.confirmChannel = null;
    this.connection = null;
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.log.error('Max reconnect attempts reached, giving up');
      return;
    }
    this.reconnectAttempts++;
    this.log.info(`Reconnect attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}`);

    await this.delay(this.RETRY_DELAY * this.reconnectAttempts); // exponential backoff

    try {
      await this.ensureConnection();
      this.reconnectAttempts = 0;
      this.log.info('Reconnected successfully');
    } catch (error) {
      this.log.error('Reconnect failed:', error);
    }
  }

  private async waitForConnection(): Promise<void> {
    while (this.isConnecting) {
      await this.delay(100);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleCloseOnSigint(): void {
    if (this.isSigintHandlerSet) {
      return;
    }

    process.once('SIGINT', async () => {
      this.log.info('Closing RabbitMQ connection...');
      try {
        if (this.channel) {
          await this.channel.close();
        }
        if (this.confirmChannel) {
          await this.confirmChannel.close();
        }
        if (this.connection) {
          await this.connection.close();
        }
        this.log.info('RabbitMQ connection closed gracefully');
      } catch (error) {
        this.log.error('Error closing RabbitMQ connection:', error);
      }
    });

    this.isSigintHandlerSet = true;
  }

  isConnected(): boolean {
    return this.connection !== null;
  }
}
