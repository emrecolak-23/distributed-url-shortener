import { Request, Response } from 'express';
import { injectable, singleton } from 'tsyringe';
import { RedirectService } from '@redirect-service/services';
import { StatusCodes } from 'http-status-codes';

@singleton()
@injectable()
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  public async redirect(req: Request, res: Response): Promise<void> {
    const { shortId } = req.params;

    if (!shortId) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: 'Short ID is required' });
      return;
    }

    const url = await this.redirectService.redirect(shortId as string);
    if (!url) {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'URL not found' });
    }
    res.status(StatusCodes.OK).json({ message: 'URL found', url });
  }
}
