import { winstonLogger } from '@emrecolak-23/jobber-share';
import { Application } from 'express';
import { Logger } from 'winston';

import http from 'http';
import { EnvConfig } from '@notification-service/configs';
import { injectable, singleton } from 'tsyringe';
import { ElasticSearch } from '@notification-service/loaders';
import { appRoutes } from '@notification-service/routes';
import { QueueConnection } from '@notification-service/queues/connection';
import { Channel } from 'amqplib';

const SERVER_PORT = 4003;

export let emailChannel: Channel | null = null;

@singleton()
@injectable()
export class NotificationServer {
  private log: Logger = winstonLogger(`${this.config.ELASTIC_SEARCH_URL}`, 'apiAuthServer', 'debug');
  constructor(
    private readonly config: EnvConfig,
    private readonly elasticSearch: ElasticSearch,
    private readonly queueConnection: QueueConnection
  ) {}

  public start(app: Application): void {
    this.routesMiddleware(app);
    this.startsElasticSearch();
    this.startQueues().catch((err) => {
      this.log.error('NotificationService failed to connect to RabbitMQ:', err);
    });
    this.startServer(app);
  }

  private routesMiddleware(app: Application): void {
    appRoutes(app);
  }

  private startsElasticSearch(): void {
    this.elasticSearch.checkConnection();
  }

  private async startQueues(): Promise<void> {
    emailChannel = await this.queueConnection.getChannel();
    console.log('emailChannel', emailChannel);
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      await this.startHttpServer(httpServer);
    } catch (err) {
      this.log.log('error', 'AuthService startServer() error method: ', err);
    }
  }

  private async startHttpServer(httpServer: http.Server): Promise<void> {
    try {
      this.log.info(`Auth server has started with process id of ${process.pid} on. auth server has started`);
      httpServer.listen(SERVER_PORT, () => {
        this.log.info(`Auth server running on port ${SERVER_PORT}`);
      });
    } catch (err) {
      this.log.log('error', 'AuthService startHttpServer() error method: ', err);
    }
  }
}
