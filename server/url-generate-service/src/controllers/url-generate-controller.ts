import { Request, Response } from 'express';
import { injectable, singleton } from 'tsyringe';
import { UrlGenerateService } from '@url-generate-service/services/url-generate.service';
import { StatusCodes } from 'http-status-codes';

@singleton()
@injectable()
export class UrlGenerateController {
  constructor(private readonly urlGenerateService: UrlGenerateService) {}

  public async generateUrl(req: Request, res: Response): Promise<void> {
    const { longUrl } = req.body;
    const shortUrl = await this.urlGenerateService.generateUrl(longUrl, req.currentUser?.id!);
    res.status(StatusCodes.OK).json({ longUrl, shortUrl, message: 'Url generated successfully' });
  }
}
