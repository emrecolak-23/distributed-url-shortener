import { IAuthPayload, winstonLogger } from '@emrecolak-23/jobber-share';
import express, { Application, NextFunction, Request, Response } from 'express';
import { Logger } from 'winston';
import hpp from 'hpp';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import StatusCodes from 'http-status-codes';
import http from 'http';
import { CustomError, IErrorResponse } from '@emrecolak-23/jobber-share';
import { EnvConfig } from '@auth-service/configs/env.config';
import { injectable, singleton } from 'tsyringe';
import { ElasticSearch } from '@auth-service/loaders';
import { verify } from 'jsonwebtoken';
import { appRoutes } from '@auth-service/routes';
import { QueueConnection } from '@auth-service/queues/connection';
import { Channel, ConfirmChannel } from 'amqplib';

const SERVER_PORT = 4003;
export let authChannel: Channel | null = null;
export let authConfirmChannel: ConfirmChannel | null = null;

@singleton()
@injectable()
export class AuthServer {
  private log: Logger = winstonLogger(`${this.config.ELASTIC_SEARCH_URL}`, 'apiAuthServer', 'debug');
  constructor(
    private readonly config: EnvConfig,
    private readonly elasticSearch: ElasticSearch,
    private readonly queueConnection: QueueConnection
  ) {}

  public start(app: Application): void {
    this.securityMiddleware(app);
    this.standartMiddleware(app);
    this.routesMiddleware(app);
    this.startsElasticSearch();
    this.startQueues().catch((err) => {
      this.log.error('AuthService failed to connect to RabbitMQ:', err);
    });
    this.errorHandler(app);
    this.startServer(app);
  }

  private securityMiddleware(app: Application): void {
    app.set('trust proxy', 1);
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: `${this.config.API_GATEWAY_URL}`,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS']
      })
    );
    // 'Bearer ' + token
    app.use((req: Request, _res: Response, next: NextFunction) => {
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        const payload = verify(token, this.config.JWT_TOKEN) as IAuthPayload;
        req.currentUser = payload;
      }

      next();
    });
  }

  private standartMiddleware(app: Application): void {
    app.use(compression());
    app.use(express.json({ limit: '200mb' }));
    app.use(express.urlencoded({ extended: true, limit: '200mb' }));
  }

  private routesMiddleware(app: Application): void {
    appRoutes(app);
  }

  private startsElasticSearch(): void {
    this.elasticSearch.checkConnection();
  }

  private async startQueues(): Promise<void> {
    authChannel = await this.queueConnection.getChannel();
    authConfirmChannel = await this.queueConnection.getConfirmChannel();
  }

  private errorHandler(app: Application): void {
    app.all(/(.*)/, (req: Request, res: Response, next: NextFunction) => {
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      this.log.log('error', `${fullUrl} endpoint does not exists`, '');
      res.status(StatusCodes.NOT_FOUND).json({ message: `The endpoint called does not exist` });
      next();
    });

    app.use((err: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
      const errorLog: Record<string, unknown> =
        err instanceof CustomError
          ? {
              message: err.message,
              statusCode: err.statusCode,
              comingFrom: err.comingFrom
            }
          : {
              message: err.message,
              statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
              comingFrom: 'AuthService errorHandler'
            };

      this.log.log('error', `AuthService ${err.comingFrom}: `, errorLog);

      if (err instanceof CustomError) {
        return res.status(err.statusCode).json(err.serializeError());
      }

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'An unexpected error occurred',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        status: 'error',
        comingFrom: 'AuthService errorHandler'
      });
      next();
    });
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
