import axios, { AxiosResponse } from 'axios';
import { AxiosService } from '@gateway-service/services/axios.service';
import { EnvConfig } from '@gateway-service/configs';
import { injectable, singleton } from 'tsyringe';

export let axiosAuthInstance: ReturnType<typeof axios.create>;

@singleton()
@injectable()
export class UrlGenerateService {
  axiosService: AxiosService;

  constructor(private readonly config: EnvConfig) {
    this.axiosService = new AxiosService(`${this.config.AUTH_BASE_URL}/api/v1/auth`, 'auth');
    axiosAuthInstance = this.axiosService.axios;
  }

  public async generateUrl(longUrl: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.post('/generate-url', { longUrl });
    return response;
  }
}
