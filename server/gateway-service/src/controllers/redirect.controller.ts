import { Request, Response } from 'express';
import { injectable, singleton } from 'tsyringe';
import { RedirectService } from '@gateway-service/services/api/redirect.service';
import { AxiosResponse } from 'axios';

@injectable()
@singleton()
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  async redirect(req: Request, res: Response): Promise<void> {
    const { shortId } = req.params;
    const response: AxiosResponse = await this.redirectService.redirect(shortId as string);
    res.redirect(response.data.url);
  }
}
