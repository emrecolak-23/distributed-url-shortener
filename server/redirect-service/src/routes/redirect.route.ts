import express, { Router } from 'express';
import { RedirectController } from '@redirect-service/controllers';
import { injectable, singleton } from 'tsyringe';

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
