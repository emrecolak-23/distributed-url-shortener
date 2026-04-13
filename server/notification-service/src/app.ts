import 'reflect-metadata';
import express, { Express } from 'express';
import { container } from 'tsyringe';
import { NotificationServer } from '@notification-service/server';
import { ElasticSearch } from '@notification-service/loaders';

const elasticSearch = container.resolve(ElasticSearch);

class Application {
  constructor(private readonly notificationServer: NotificationServer) {}

  public async initialize(): Promise<void> {
    const app: Express = express();
    await elasticSearch.checkConnection();
    this.notificationServer.start(app);
  }
}

const notificationServer = container.resolve(NotificationServer);
const application: Application = new Application(notificationServer);
application.initialize();
