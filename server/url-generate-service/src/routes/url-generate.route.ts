import express, { Router } from 'express';
import { UrlGenerateController } from '@url-generate-service/controllers/url-generate-controller';
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class UrlGenerateRoute {
  private router: Router;

  constructor(private readonly urlGenerateController: UrlGenerateController) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/generate-url', this.urlGenerateController.generateUrl.bind(this.urlGenerateController));

    return this.router;
  }
}
