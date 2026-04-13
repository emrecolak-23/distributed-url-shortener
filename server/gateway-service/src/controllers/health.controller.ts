import { Request, Response } from 'express';
import { injectable, singleton } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

@injectable()
@singleton()
export class HealthController {
  public health(_req: Request, res: Response): void {
    res.status(StatusCodes.OK).json({ status: 'API Gateway Service is healthy and OK' });
  }
}
