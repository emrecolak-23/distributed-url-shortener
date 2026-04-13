import { winstonLogger } from '@emrecolak-23/jobber-share';
import { injectable, singleton } from 'tsyringe';
import { EnvConfig } from '@url-generate-service/config';
import { Logger } from 'winston';
import { createClient, Client, CreateMode } from 'node-zookeeper-client';

@singleton()
@injectable()
export class ZooKeeper {
  private log: Logger = winstonLogger(`${this.config.ELASTIC_SEARCH_URL}`, 'urlGenerateServiceZookeeperConnection', 'debug');
  private client: Client;
  private workerId: number = 0;
  private counter: number = 0;
  private rangeSize: number = 1_000_000;

  constructor(private readonly config: EnvConfig) {
    this.client = createClient(this.config.ZOOKEEPER_HOST || 'localhost:2181');
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.once('connected', () => {
        this.log.info('ZooKeeper connection successful');

        this.ensurePath('/url-shortener/workers', (err) => {
          if (err) return reject(err);

          this.client.create(
            '/url-shortener/workers/worker-',
            Buffer.from([]),
            CreateMode.EPHEMERAL_SEQUENTIAL,
            (err: any, path: string) => {
              if (err) {
                this.log.error('Worker node oluşturulamadı: ', err);
                return reject(err);
              }
              this.workerId = parseInt(path.split('-').pop()!);
              this.counter = this.workerId * this.rangeSize;
              this.log.info(`Worker ID: ${this.workerId}, range: ${this.counter} - ${this.counter + this.rangeSize - 1}`);
              resolve();
            }
          );
        });
      });

      this.client.once('connectedReadOnly', () => {
        this.log.warn('ZooKeeper connected in read-only mode');
      });

      this.client.connect();
    });
  }

  private ensurePath(path: string, callback: (err?: Error) => void): void {
    this.client.mkdirp(path, (err: any) => {
      if (err) {
        this.log.error(`Path oluşturulamadı ${path}: `, err);
        return callback(err);
      }
      callback();
    });
  }

  generateId(): string {
    const id = this.counter++;
    if (this.counter >= (this.workerId + 1) * this.rangeSize) {
      this.log.warn('ID range tükendi, yeni range gerekli');
    }
    return this.toBase62(id);
  }

  private toBase62(num: number): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    do {
      result = chars[num % 62] + result;
      num = Math.floor(num / 62);
    } while (num > 0);
    return result;
  }
}
