import express, { Router } from 'express';
import { AuthController } from '@auth-service/controllers';
import { injectable, singleton } from 'tsyringe';
import { ValidateMiddleware } from '@auth-service/middlewares';
import { signupSchema } from '@auth-service/schemas/signup';

@singleton()
@injectable()
export class AuthRoutes {
  private router: Router;

  constructor(
    private readonly authController: AuthController,
    private readonly validateMiddleware: ValidateMiddleware
  ) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/signup', this.validateMiddleware.validate(signupSchema), this.authController.signUp.bind(this.authController));

    return this.router;
  }
}
