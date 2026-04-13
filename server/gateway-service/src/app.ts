import 'reflect-metadata';
import express, { Express } from 'express';
import { container } from 'tsyringe';
import { GatewayServer } from '@gateway-service/server';

class Application {
  constructor(private readonly gatewayServer: GatewayServer) {}

  public initialize(): void {
    const app: Express = express();
    this.gatewayServer.start(app);
  }
}

const gatewayServer = container.resolve(GatewayServer);
const application: Application = new Application(gatewayServer);
application.initialize();
