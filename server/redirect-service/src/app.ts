import 'reflect-metadata';
import express, { Express } from 'express';
import { container } from 'tsyringe';
import { Cassandra } from '@redirect-service/loaders/cassandra';
import { RedirectServer } from '@redirect-service/server';
import { Redis } from '@redirect-service/loaders/redis';

const cassandra = container.resolve(Cassandra);
const redis = container.resolve(Redis);
class Application {
  constructor(private readonly redirectServer: RedirectServer) {}
  public async initialize(): Promise<void> {
    const app: Express = express();
    await cassandra.connect();
    await redis.connect();
    this.redirectServer.start(app);
  }
}

const redirectServer = container.resolve(RedirectServer);
const application: Application = new Application(redirectServer);
application.initialize();
