import { AuthService } from '@gateway-service/services/api/auth.service';
import { AxiosResponse } from 'axios';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async signUp(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await this.authService.sigUp(req.body);

    req.session = {
      jwt: response.data.token
    };

    res.status(StatusCodes.CREATED).json({ message: response.data.message, user: response.data.user });
  }

  async signIn(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await this.authService.signIn(req.body);

    req.session = {
      jwt: response.data.token
    };

    res.status(StatusCodes.OK).json({ message: response.data.message, token: response.data.token, user: response.data.user });
  }

  async signOut(req: Request, res: Response): Promise<void> {
    req.session = null;
    res.status(StatusCodes.OK).json({ message: 'Signed out successfully', user: {} });
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.body;
    const response: AxiosResponse = await this.authService.verifyEmail(token);

    req.session = {
      jwt: response.data.token
    };

    res.status(StatusCodes.CREATED).json({ message: response.data.message, user: response.data.user });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const response: AxiosResponse = await this.authService.forgotPassword(email);

    res.status(StatusCodes.OK).json({ message: response.data.message });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    const response: AxiosResponse = await this.authService.resetPassword(token as string, password, confirmPassword);

    res.status(StatusCodes.OK).json({ message: response.data.message });
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;
    const response: AxiosResponse = await this.authService.changePassword(currentPassword, newPassword);

    res.status(StatusCodes.OK).json({ message: response.data.message });
  }

  async currentUser(_req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await this.authService.getCurrentUser();

    res.status(StatusCodes.OK).json({ message: response.data.message, user: response.data.user });
  }

  async resentEmailVerification(req: Request, res: Response): Promise<void> {
    const { email, userId } = req.body;
    const response: AxiosResponse = await this.authService.resendEmail({ userId, email });

    res.status(StatusCodes.OK).json({ message: response.data.message, user: response.data.user });
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const { username } = req.params;
    const response: AxiosResponse = await this.authService.getRefreshToken(username as string);
    req.session = {
      jwt: response.data.token
    };
    res.status(StatusCodes.OK).json({ message: response.data.message, token: response.data.token, user: response.data.user });
  }
}
