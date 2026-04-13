import { IAuthUser } from '@auth-service/interfaces';

export interface IAuthUserResponse {
  user: IAuthUser;
  token: string;
}
