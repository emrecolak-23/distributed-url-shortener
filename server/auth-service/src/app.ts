import 'reflect-metadata';
import express, { Express } from 'express';
import { container } from 'tsyringe';
import { AuthServer } from '@auth-service/server';
import { Database } from '@auth-service/loaders';

const database = container.resolve(Database);

class Application {
  constructor(private readonly authServer: AuthServer) {}

  public async initialize(): Promise<void> {
    const app: Express = express();
    await database.connect();
    this.authServer.start(app);
  }
}

const authServer = container.resolve(AuthServer);
const application: Application = new Application(authServer);
application.initialize();
