import express, { Router } from 'express';
import { AuthController } from '@auth-service/controllers';
import { injectable, singleton } from 'tsyringe';
import { ValidateMiddleware } from '@auth-service/middlewares';
import {
  signupSchema,
  signinSchema,
  verifyEmailSchema,
  emailSchema,
  passwordSchema,
  changePasswordSchema,
  resentEmailVerificationSchema,
  usernameSchema
} from '@auth-service/schemas';

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
    this.router.post('/signin', this.validateMiddleware.validate(signinSchema), this.authController.signIn.bind(this.authController));

    this.router.patch(
      '/verify-email',
      this.validateMiddleware.validate(verifyEmailSchema),
      this.authController.verifyEmail.bind(this.authController)
    );

    this.router.post(
      '/forgot-password',
      this.validateMiddleware.validate(emailSchema),
      this.authController.forgotPassword.bind(this.authController)
    );

    this.router.patch(
      '/reset-password/:token',
      this.validateMiddleware.validate(passwordSchema),
      this.authController.resetPassword.bind(this.authController)
    );

    this.router.patch(
      '/change-password',
      this.validateMiddleware.validate(changePasswordSchema),
      this.authController.changePassword.bind(this.authController)
    );

    this.router.get('/currentuser', this.authController.currentUser.bind(this.authController));

    this.router.post(
      '/resend-email',
      this.validateMiddleware.validate(resentEmailVerificationSchema),
      this.authController.resentEmailVerification.bind(this.authController)
    );

    this.router.post(
      '/refresh-token/:username',
      this.validateMiddleware.validateParams(usernameSchema),
      this.authController.refreshToken.bind(this.authController)
    );

    return this.router;
  }
}
