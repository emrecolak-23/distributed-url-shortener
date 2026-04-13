import express, { Router } from 'express';
import { injectable, singleton } from 'tsyringe';
import { AuthController } from '@gateway-service/controllers/auth.controller';

@singleton()
@injectable()
export class AuthRoute {
  private router: Router;

  constructor(private readonly authController: AuthController) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/signup', this.authController.signUp.bind(this.authController));
    this.router.post('/signin', this.authController.signIn.bind(this.authController));
    this.router.post('/signout', this.authController.signOut.bind(this.authController));
    this.router.patch('/verify-email', this.authController.verifyEmail.bind(this.authController));
    this.router.post('/forgot-password', this.authController.forgotPassword.bind(this.authController));
    this.router.patch('/reset-password/:token', this.authController.resetPassword.bind(this.authController));
    this.router.patch('/change-password', this.authController.changePassword.bind(this.authController));
    this.router.post('/resend-email', this.authController.resentEmailVerification.bind(this.authController));

    return this.router;
  }
}
