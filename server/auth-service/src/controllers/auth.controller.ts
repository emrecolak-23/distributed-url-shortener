import { injectable, singleton } from 'tsyringe';
import { Request, Response } from 'express';
import { AuthService } from '@auth-service/services/auth.service';
import { StatusCodes } from 'http-status-codes';
import { IAuthUserResponse } from '@auth-service/interfaces';
import { IAuthUser } from '@auth-service/interfaces';

@injectable()
@singleton()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async signUp(req: Request, res: Response): Promise<void> {
    const { user, token }: IAuthUserResponse = await this.authService.signUp(req.body);

    res.status(StatusCodes.CREATED).json({
      message: 'User created successfully',
      user,
      token
    });
  }

  async signIn(req: Request, res: Response): Promise<void> {
    const { user, token }: IAuthUserResponse = await this.authService.signIn(req.body);

    res.status(StatusCodes.OK).json({
      message: 'User signed in successfully',
      user,
      token
    });
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.body;

    const updatedUser: IAuthUser = await this.authService.verifyEmail(token);

    res.status(StatusCodes.OK).json({
      message: 'Email verified successfully',
      user: updatedUser
    });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    await this.authService.forgotPassword(email);

    res.status(StatusCodes.OK).json({
      message: 'Password reset email sent successfully'
    });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    await this.authService.resetPassword(token as string, password, confirmPassword);

    res.status(StatusCodes.OK).json({
      message: 'Password reset successfully'
    });
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;

    await this.authService.changePassword(req.currentUser?.username!, currentPassword, newPassword);

    res.status(StatusCodes.OK).json({
      message: 'Password changed successfully'
    });
  }

  async currentUser(req: Request, res: Response): Promise<void> {
    const user: IAuthUser | null = await this.authService.currentUser(req.currentUser?.id!);

    res.status(StatusCodes.OK).json({
      message: 'User fetched successfully',
      user
    });
  }

  async resentEmailVerification(req: Request, res: Response): Promise<void> {
    const { email, userId } = req.body;
    const updatedUser: IAuthUser = await this.authService.resentEmailVerification(email, userId);

    res.status(StatusCodes.OK).json({
      message: 'Email verification resent successfully',
      user: updatedUser
    });
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const { username } = req.params;

    const { token, user }: IAuthUserResponse = await this.authService.refreshToken(username as string);

    res.status(StatusCodes.OK).json({
      message: 'Refresh token generated successfully',
      token,
      user
    });
  }
}
