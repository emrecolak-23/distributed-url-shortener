import { injectable, singleton } from 'tsyringe';
import { EnvConfig } from '@auth-service/configs';
import { Logger } from 'winston';
import { BadRequestError, winstonLogger, ISignInPayload, isEmail } from '@emrecolak-23/jobber-share';
import { IAuthDocument } from '@emrecolak-23/jobber-share';
import { Database } from '@auth-service/loaders';
import { IAuthUser, IAuthUserResponse } from '@auth-service/interfaces';
import { compare, hash } from 'bcryptjs';
import { IEmailMessageDetail } from '@auth-service/interfaces';
import { AuthProducer } from '@auth-service/queues/auth.producer';
import { sign } from 'jsonwebtoken';
import crypto from 'crypto';

@singleton()
@injectable()
export class AuthService {
  private log: Logger = winstonLogger(`${this.config.ELASTIC_SEARCH_URL}`, 'authService', 'debug');
  constructor(
    private readonly config: EnvConfig,
    private readonly database: Database,
    private readonly authProducer: AuthProducer
  ) {}

  async signUp(data: IAuthDocument): Promise<any> {
    try {
      const { username, email, password } = data;

      const existingUsers = await this.database.query<IAuthUser>('SELECT * FROM users WHERE username = $1 OR email = $2', [
        username,
        email
      ]);
      const checkIfUserExists: IAuthUser | null = existingUsers.rows[0] ?? null;
      if (checkIfUserExists) {
        throw new BadRequestError('Invalid credentials. Email or Username already in use', 'AuthService createAuthUser() method error');
      }

      const hashedPassword = await hash(password!, 10);
      const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
      const randomCharacters: string = randomBytes.toString('hex');

      const emailVerificationTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 5);

      const user: IAuthUser = {
        username,
        email,
        password: hashedPassword,
        emailVerificationToken: randomCharacters,
        emailVerificationTokenExpiresAt
      };

      const newUser = await this.database.query<IAuthUser>(
        'INSERT INTO users (username, email, password, emailVerificationToken) VALUES ($1, $2, $3, $4) RETURNING *',
        [user.username, user.email, user.password, user.emailVerificationToken]
      );

      const verificationLink: string = `${this.config.CLIENT_URL}/confirm-email?token=${user.emailVerificationToken}`;

      const emailMessageDetail: IEmailMessageDetail = {
        receiverEmail: email,
        verifyLink: verificationLink,
        template: 'verifyEmail',
        messageId: crypto.randomUUID().toString()
      } as IEmailMessageDetail;

      await this.authProducer.publishDirectMessage({
        exchangeName: 'jobber-email-notification',
        routingKey: 'auth-email',
        message: JSON.stringify(emailMessageDetail),
        logMessage: `Auth Email Message Published: ${JSON.stringify(emailMessageDetail)}`
      });

      const token = this.signToken(newUser.rows[0].id ?? 0, newUser.rows[0].email ?? '', newUser.rows[0].username ?? '');

      return {
        user: newUser.rows[0],
        token
      };
    } catch (error) {
      this.log.error('AuthService signUp() error:', error);
      throw new BadRequestError('Failed to sign up', 'AuthService signUp() method error');
    }
  }

  async signIn(data: ISignInPayload): Promise<IAuthUserResponse> {
    const { username, password } = data;

    const isValidEmail = isEmail(username);

    let existingUser: IAuthUser | null = null;
    if (isValidEmail) {
      const existingUsers = await this.database.query<IAuthUser>('SELECT * FROM users WHERE email = $1', [username]);
      existingUser = existingUsers.rows[0] ?? null;
    } else {
      const existingUsers = await this.database.query<IAuthUser>('SELECT * FROM users WHERE username = $1', [username]);
      existingUser = existingUsers.rows[0] ?? null;
    }

    if (!existingUser) {
      throw new BadRequestError('Invalid credentials. User not found', 'AuthService signIn() method error');
    }

    const passwordsMatch = await compare(password, existingUser.password!);

    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials. Password is incorrect', 'AuthService signIn() method error');
    }

    const userJwt: string = this.signToken(existingUser.id!, existingUser.email!, existingUser.username!);

    const { password: _, ...userWithoutPassword } = existingUser;

    return {
      user: userWithoutPassword,
      token: userJwt
    };
  }

  async verifyEmail(token: string): Promise<any> {
    const checkIfUserExists = await this.database.query<IAuthUser>('SELECT * FROM users WHERE emailVerificationToken = $1', [token]);

    if (!checkIfUserExists.rows[0]) {
      throw new BadRequestError('Verification token is either invalid or already used.', 'AuthService verifyEmail() method error');
    }

    const isTokenExpired =
      checkIfUserExists.rows[0].emailVerificationTokenExpiresAt && checkIfUserExists.rows[0].emailVerificationTokenExpiresAt < new Date();

    if (isTokenExpired) {
      throw new BadRequestError('Verification token has expired.', 'AuthService verifyEmail() method error');
    }

    const updatedUser = await this.database.query<IAuthUser>(
      'UPDATE users SET emailVerified = TRUE, emailVerificationToken = NULL, emailVerificationTokenExpiresAt = NULL WHERE id = $1 RETURNING *',
      [checkIfUserExists.rows[0].id]
    );

    return updatedUser.rows[0];
  }

  async forgotPassword(email: string): Promise<void> {
    const existingUser = await this.database.query<IAuthUser>('SELECT * FROM users WHERE email = $1', [email]);

    if (!existingUser.rows[0]) {
      throw new BadRequestError('Invalid credentials', 'AuthService forgotPassword() method error');
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters = randomBytes.toString('hex');
    const date: Date = new Date();
    date.setHours(date.getHours() + 1);

    await this.database.query<IAuthUser>(
      'UPDATE users SET passwordResetToken = $1, passwordResetTokenExpiresAt = $2 WHERE id = $3 RETURNING *',
      [randomCharacters, date, existingUser.rows[0].id]
    );

    const resetLink = `${this.config.CLIENT_URL}/reset-password?token=${randomCharacters}`;

    const messageDetails: IEmailMessageDetail = {
      receiverEmail: existingUser.rows[0].email!,
      resetLink: resetLink,
      username: existingUser.rows[0].username!,
      template: 'forgotPassword',
      messageId: crypto.randomUUID().toString()
    };

    await this.authProducer.publishDirectMessage({
      exchangeName: 'jobber-email-notification',
      routingKey: 'auth-email',
      message: JSON.stringify(messageDetails),
      logMessage: `Auth Email Message Published: ${JSON.stringify(messageDetails)}`
    });
  }

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<void> {
    if (password !== confirmPassword) {
      throw new BadRequestError('Passwords do not match', 'AuthService resetPassword() method error');
    }

    const existingUser = await this.database.query<IAuthUser>('SELECT * FROM users WHERE passwordResetToken = $1', [token]);

    if (!existingUser.rows[0]) {
      throw new BadRequestError('Reset password token is either invalid or already used.', 'AuthService resetPassword() method error');
    }

    const isTokenExpired =
      existingUser.rows[0].passwordResetTokenExpiresAt && existingUser.rows[0].passwordResetTokenExpiresAt < new Date();

    if (isTokenExpired) {
      throw new BadRequestError('Reset password token has expired.', 'AuthService resetPassword() method error');
    }

    const hashedPassword = await hash(password, 10);

    await this.database.query<IAuthUser>(
      'UPDATE users SET password = $1, passwordResetToken = NULL, passwordResetTokenExpiresAt = NULL, passwordResetAt = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [hashedPassword, existingUser.rows[0].id]
    );

    const messageDetails: IEmailMessageDetail = {
      username: existingUser.rows[0].username,
      template: 'resetPasswordSuccess',
      messageId: crypto.randomUUID().toString()
    } as IEmailMessageDetail;

    await this.authProducer.publishDirectMessage({
      exchangeName: 'jobber-email-notification',
      routingKey: 'auth-email',
      message: JSON.stringify(messageDetails),
      logMessage: `Auth Email Message Published: ${JSON.stringify(messageDetails)}`
    });
  }

  async changePassword(username: string, currentPassword: string, newPassword: string): Promise<void> {
    if (currentPassword === newPassword) {
      throw new BadRequestError('New password cannot be the same as the current password', 'AuthService changePassword() method error');
    }

    const existingUser = await this.database.query<IAuthUser>('SELECT * FROM users WHERE username = $1', [username]);

    if (!existingUser.rows[0]) {
      throw new BadRequestError('Invalid credentials', 'AuthService changePassword() method error');
    }

    const passwordsMatch = await compare(currentPassword, existingUser.rows[0].password!);

    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials. Password is incorrect', 'AuthService changePassword() method error');
    }

    const hashedPassword = await hash(newPassword, 10);

    await this.database.query<IAuthUser>('UPDATE users SET password = $1 WHERE id = $2 RETURNING *', [
      hashedPassword,
      existingUser.rows[0].id
    ]);

    const messageDetails: IEmailMessageDetail = {
      username: existingUser.rows[0].username!,
      template: 'passwordChanged',
      messageId: crypto.randomUUID().toString()
    } as IEmailMessageDetail;

    await this.authProducer.publishDirectMessage({
      exchangeName: 'jobber-email-notification',
      routingKey: 'auth-email',
      message: JSON.stringify(messageDetails),
      logMessage: `Auth Email Message Published: ${JSON.stringify(messageDetails)}`
    });
  }

  async currentUser(userId: number): Promise<IAuthUser> {
    const existingUser = await this.database.query<IAuthUser>('SELECT * FROM users WHERE id = $1', [userId]);

    if (!existingUser.rows[0]) {
      throw new BadRequestError('Invalid credentials', 'AuthService currentUser() method error');
    }

    const { password: _, ...userWithoutPassword } = existingUser.rows[0];
    return userWithoutPassword;
  }

  async resentEmailVerification(email: string, userId: number): Promise<IAuthUser> {
    const checkIfUserExists = await this.database.query<IAuthUser>('SELECT * FROM users WHERE id = $1', [userId]);

    if (!checkIfUserExists.rows[0]) {
      throw new BadRequestError('Invalid credentials', 'AuthService resentEmailVerification() method error');
    }

    if (checkIfUserExists.rows[0].email !== email) {
      throw new BadRequestError('Invalid credentials', 'AuthService resentEmailVerification() method error');
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters = randomBytes.toString('hex');
    const verificationLink: string = `${this.config.CLIENT_URL}/confirm-email?token=${randomCharacters}`;

    const date: Date = new Date();
    date.setHours(date.getHours() + 1);

    await this.database.query<IAuthUser>(
      'UPDATE users SET emailVerificationToken = $1, emailVerificationTokenExpiresAt = $2 WHERE id = $3 RETURNING *',
      [randomCharacters, date, userId]
    );

    const messageDetails: IEmailMessageDetail = {
      receiverEmail: email,
      verifyLink: verificationLink,
      template: 'verifyEmail',
      messageId: crypto.randomUUID().toString()
    } as IEmailMessageDetail;

    await this.authProducer.publishDirectMessage({
      exchangeName: 'jobber-email-notification',
      routingKey: 'auth-email',
      message: JSON.stringify(messageDetails),
      logMessage: `Auth Email Message Published: ${JSON.stringify(messageDetails)}`
    });

    const { password: _, ...userWithoutPassword } = checkIfUserExists.rows[0];

    return userWithoutPassword;
  }

  async refreshToken(username: string): Promise<any> {
    const existingUser = await this.database.query<IAuthUser>('SELECT * FROM users WHERE username = $1', [username]);

    if (!existingUser.rows[0]) {
      throw new BadRequestError('Invalid credentials', 'AuthService refreshToken() method error');
    }

    const userJwt: string = this.signToken(existingUser.rows[0].id!, existingUser.rows[0].email!, existingUser.rows[0].username!);

    return { token: userJwt, user: existingUser.rows[0] };
  }

  signToken(id: number, email: string, username: string): string {
    return sign({ id, email, username }, this.config.JWT_TOKEN!);
  }
}
