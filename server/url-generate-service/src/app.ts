import 'reflect-metadata';
import express, { Express } from 'express';
import { container } from 'tsyringe';
import { UrlGenerateServer } from './server';
import { Cassandra } from './loaders/cassandra';
import { ZooKeeper } from './loaders/zookeeper';

const cassandra = container.resolve(Cassandra);
const zookeeper = container.resolve(ZooKeeper);
class Application {
  constructor(private readonly urlGenerateServer: UrlGenerateServer) {}
  public async initialize(): Promise<void> {
    const app: Express = express();
    await cassandra.connect();
    await zookeeper.connect();
    this.urlGenerateServer.start(app);
  }
}

const urlGenerateServer = container.resolve(UrlGenerateServer);
const application: Application = new Application(urlGenerateServer);
application.initialize();
