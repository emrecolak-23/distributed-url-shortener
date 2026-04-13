import axios, { AxiosResponse } from 'axios';
import { AxiosService } from '@gateway-service/services/axios.service';
import { EnvConfig } from '@gateway-service/configs';
import { injectable, singleton } from 'tsyringe';

export let axiosUrlGenerateInstance: ReturnType<typeof axios.create>;

@singleton()
@injectable()
export class UrlGenerateService {
  axiosService: AxiosService;

  constructor(private readonly config: EnvConfig) {
    this.axiosService = new AxiosService(`${this.config.URL_GENERATE_BASE_URL}/api/v1/urls`, 'auth');
    axiosUrlGenerateInstance = this.axiosService.axios;
  }

  public async generateUrl(longUrl: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosUrlGenerateInstance.post('/shorten', { longUrl });
    return response;
  }
}
