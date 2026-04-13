import axios, { AxiosResponse } from 'axios';
import { AxiosService } from '@gateway-service/services/axios.service';
import { EnvConfig } from '@gateway-service/configs';
import { IAuth } from '@emrecolak-23/jobber-share';
import { injectable, singleton } from 'tsyringe';

export let axiosAuthInstance: ReturnType<typeof axios.create>;

@singleton()
@injectable()
export class AuthService {
  axiosService: AxiosService;

  constructor(private readonly config: EnvConfig) {
    this.axiosService = new AxiosService(`${this.config.AUTH_BASE_URL}/api/v1/auth`, 'auth');
    axiosAuthInstance = this.axiosService.axios;
  }

  async getCurrentUser(): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.get('/currentuser');
    return response;
  }

  async getRefreshToken(username: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.post(`/refresh-token/${username}`);
    return response;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.patch('/change-password', { currentPassword, newPassword });
    return response;
  }

  async sigUp(body: IAuth): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.post('/signup', body);
    return response;
  }

  async signIn(body: IAuth): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.post('/signin', body);
    return response;
  }

  async verifyEmail(token: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.patch('/verify-email', { token });
    return response;
  }

  async resendEmail(data: { userId: number; email: string }): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.post('/resend-email', data);
    return response;
  }

  async forgotPassword(email: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.post('/forgot-password', { email });
    return response;
  }

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.patch(`/reset-password/${token}`, { password, confirmPassword });
    return response;
  }

  async getGigs(query: string, from: string, size: string, type: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.get(`/search/gig/${from}/${size}/${type}?${query}`);
    return response;
  }

  async getGig(gigId: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.get(`/search/gig/${gigId}`);
    return response;
  }

  async seed(count: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.put(`/seeds/${count}`);
    return response;
  }
}
