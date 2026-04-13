import { Request, Response } from 'express';
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class HealthController {
  public async health(_req: Request, res: Response): Promise<void> {
    res.status(200).json({ message: 'OrderService is running' });
  }
}
