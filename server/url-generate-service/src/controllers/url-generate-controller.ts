import { Request, Response } from 'express';
import { injectable, singleton } from 'tsyringe';
import { UrlGenerateService } from '@url-generate-service/services/url-generate.service';

@singleton()
@injectable()
export class UrlGenerateController {
  constructor(private readonly urlGenerateService: UrlGenerateService) {}

  public async generateUrl(req: Request, res: Response): Promise<void> {
    const { longUrl } = req.body;
    const shortUrl = await this.urlGenerateService.generateUrl(longUrl);
    res.status(200).json({ longUrl, shortUrl, message: 'Url generated successfully' });
  }
}
