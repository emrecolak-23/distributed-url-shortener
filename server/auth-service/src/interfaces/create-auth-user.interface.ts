import { IAuthDocument } from '@emrecolak-23/jobber-share';

export interface IAuthUserResponse {
  user: IAuthDocument;
  token: string;
}
