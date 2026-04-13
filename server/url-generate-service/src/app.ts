import 'reflect-metadata';
import express, { Express } from 'express';
import { container } from 'tsyringe';
import { UrlGenerateServer } from './server';
import { Cassandra } from './loaders/cassandra';

const cassandra = container.resolve(Cassandra);

class Application {
  constructor(private readonly urlGenerateServer: UrlGenerateServer) {}
  public async initialize(): Promise<void> {
    const app: Express = express();
    await cassandra.connect();
    this.urlGenerateServer.start(app);
  }
}

const urlGenerateServer = container.resolve(UrlGenerateServer);
const application: Application = new Application(urlGenerateServer);
application.initialize();
