import express, { Router } from 'express';
import { AuthController } from '@gateway-service/controllers';
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class CurrentUserRoute {
  private router: Router;

  constructor(private readonly authController: AuthController) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/resend-email', this.authController.resentEmailVerification.bind(this.authController));
    this.router.get('/current-user', this.authController.currentUser.bind(this.authController));
    this.router.post('/refresh-token/:username', this.authController.refreshToken.bind(this.authController));
    this.router.patch('/change-password', this.authController.changePassword.bind(this.authController));

    return this.router;
  }
}
