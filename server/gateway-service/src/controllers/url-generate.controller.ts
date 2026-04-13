import { Request, Response } from 'express';
import { injectable, singleton } from 'tsyringe';
import { AxiosResponse } from 'axios';
import { UrlGenerateService } from '@gateway-service/services/api/url-generate.service';

@injectable()
@singleton()
export class UrlGenerateController {
  constructor(private readonly urlGenerateService: UrlGenerateService) {}

  async generateUrl(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await this.urlGenerateService.generateUrl(req.body.longUrl);
    res.status(response.status).json({
      message: response.data.message,
      shortUrl: response.data.shortUrl,
      longUrl: response.data.longUrl
    });
  }
}
