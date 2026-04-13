export interface IAuthUser {
  id?: number;
  username?: string;
  email?: string;
  password?: string;
  emailVerified?: number;
  emailVerificationToken?: string;
  emailVerificationTokenExpiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  passwordResetToken?: string;
  passwordResetTokenExpiresAt?: Date;
  passwordResetAt?: Date;
}
