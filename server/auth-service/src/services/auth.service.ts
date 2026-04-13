import { injectable, singleton } from 'tsyringe';
import { EnvConfig } from '@auth-service/configs';
import { Logger } from 'winston';
import { BadRequestError, winstonLogger } from '@emrecolak-23/jobber-share';
import { IAuthDocument } from '@emrecolak-23/jobber-share';
import { Database } from '@auth-service/loaders';
import { IAuthUser } from '@auth-service/interfaces';
import { hash } from 'bcryptjs';
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
      const user: IAuthUser = {
        username,
        email,
        password: hashedPassword,
        emailVerificationToken: randomCharacters
      };

      const newUser = await this.database.query<IAuthUser>(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
        [user.username, user.email, user.password]
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

      const token = this.signToken(newUser.rows[0].id ?? 0);

      return {
        user: newUser.rows[0],
        token
      };
    } catch (error) {
      this.log.error('AuthService signUp() error:', error);
      throw new BadRequestError('Failed to sign up', 'AuthService signUp() method error');
    }
  }

  async signIn(_data: unknown): Promise<any> {}

  async verifyEmail(_token: string): Promise<any> {}

  async forgotPassword(_email: string): Promise<void> {}

  async resetPassword(_token: string, _password: string, _confirmPassword: string): Promise<void> {}

  async changePassword(_username: string, _currentPassword: string, _newPassword: string): Promise<void> {}

  async currentUser(_userId: number): Promise<any> {}

  async resentEmailVerification(_email: string, _userId: number): Promise<any> {}

  async refreshToken(_username: string): Promise<any> {}

  private signToken(id: number): string {
    return sign({ id }, `${this.config.JWT_TOKEN}`, { expiresIn: '1h' });
  }
}
