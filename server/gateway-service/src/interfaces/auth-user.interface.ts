export interface IAuthUser {
  id?: number;
  username?: string;
  email?: string;
  password?: string;
  emailVerified?: number;
  emailVerificationToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}
