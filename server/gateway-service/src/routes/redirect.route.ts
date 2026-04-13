import express, { Router } from 'express';
import { injectable, singleton } from 'tsyringe';
import { RedirectController } from '@gateway-service/controllers/redirect.controller';

@singleton()
@injectable()
export class RedirectRoute {
  private router: Router;

  constructor(private readonly redirectController: RedirectController) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/:shortId', this.redirectController.redirect.bind(this.redirectController));

    return this.router;
  }
}
