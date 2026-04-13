import 'reflect-metadata';
import express, { Express } from 'express';
import { container } from 'tsyringe';
import { AuthServer } from '@auth-service/server';

class Application {
  constructor(private readonly authServer: AuthServer) {}

  public initialize(): void {
    const app: Express = express();
    this.authServer.start(app);
  }
}

const authServer = container.resolve(AuthServer);
const application: Application = new Application(authServer);
application.initialize();
