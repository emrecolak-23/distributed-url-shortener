import axios, { AxiosResponse } from 'axios';
import { AxiosService } from '@gateway-service/services/axios.service';
import { EnvConfig } from '@gateway-service/configs';
import { injectable, singleton } from 'tsyringe';

export let axiosRedirectInstance: ReturnType<typeof axios.create>;

@singleton()
@injectable()
export class RedirectService {
  axiosService: AxiosService;

  constructor(private readonly config: EnvConfig) {
    this.axiosService = new AxiosService(`${this.config.URL_REDIRECT_BASE_URL}/api/v1/redirect`, 'auth');
    axiosRedirectInstance = this.axiosService.axios;
  }

  public async redirect(shortId: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosRedirectInstance.get(`/${shortId}`);
    return response;
  }
}
