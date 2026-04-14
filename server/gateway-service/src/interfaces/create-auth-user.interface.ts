import { IAuthUser } from './auth-user.interface';

export interface IAuthUserResponse {
  user: IAuthUser;
  token: string;
}
