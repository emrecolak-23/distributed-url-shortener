import express, { Router } from 'express';
import { injectable, singleton } from 'tsyringe';
import { UrlGenerateController } from '@gateway-service/controllers/url-generate.controller';

@singleton()
@injectable()
export class UrlGenerateRoute {
  private router: Router;

  constructor(private readonly urlGenerateController: UrlGenerateController) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/shorten', this.urlGenerateController.generateUrl.bind(this.urlGenerateController));

    return this.router;
  }
}
