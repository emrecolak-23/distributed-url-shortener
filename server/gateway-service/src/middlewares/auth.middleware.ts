import { BadRequestError, IAuthPayload, NotAuthorizedError, winstonLogger } from '@emrecolak-23/jobber-share';
import { NextFunction, Request, Response } from 'express';
import { singleton, injectable } from 'tsyringe';
import JWT from 'jsonwebtoken';
import { EnvConfig } from '@gateway-service/configs';
import { Logger } from 'winston';

@singleton()
@injectable()
export class AuthMiddleware {
  private log: Logger = winstonLogger(`${this.config.ELASTIC_SEARCH_URL}`, 'AuthMiddleware', 'debug');
  constructor(private readonly config: EnvConfig) {}
  public verifyUser(req: Request, _res: Response, next: NextFunction) {
    this.log.log('info', 'Auth Middleware Debug');
    this.log.log('info', `Cookies: ${req.headers.cookie}`);
    this.log.log('info', `Session: ${req.session}`);
    this.log.log('info', `Session JWT: ${req.session?.jwt}`);
    this.log.log('info', '===========================');

    if (!req.session?.jwt) {
      throw new NotAuthorizedError('Token is not available. Please log in.', 'GatewayService verifyUser() method error');
    }

    try {
      const payload: IAuthPayload = JWT.verify(req.session.jwt, `${this.config.JWT_TOKEN}`) as IAuthPayload;
      req.currentUser = payload;
    } catch (error) {
      throw new NotAuthorizedError('Token is not available. Please log in.', 'GatewayService verifyUser() method invalid session error');
    }

    next();
  }

  public checkAuthentication(req: Request, _res: Response, next: NextFunction) {
    if (!req.currentUser) {
      throw new BadRequestError('Authentication is required to access this routes', 'GatewayService checkAuthentication() method error');
    }

    next();
  }
}
