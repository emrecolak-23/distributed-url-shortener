import express, { Router } from 'express';
import { HealthController } from '@auth-service/controllers';
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class HealthRoute {
  private router: Router;

  constructor(private readonly healthController: HealthController) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/auth-health', this.healthController.health.bind(this.healthController));

    return this.router;
  }
}
