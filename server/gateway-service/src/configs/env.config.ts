import dotenv from 'dotenv';
import { singleton, injectable } from 'tsyringe';

dotenv.config({});

@singleton()
@injectable()
export class EnvConfig {
  public ENABLE_APM: string;
  public GATEWAY_JWT_TOKEN: string;
  public JWT_TOKEN: string;
  public NODE_ENV: string;
  public SECRET_KEY_ONE: string;
  public SECRET_KEY_TWO: string;
  public CLIENT_URL: string;
  public AUTH_BASE_URL: string;
  public URL_GENERATE_BASE_URL: string;
  public URL_REDIRECT_BASE_URL: string;
  public ELASTIC_SEARCH_URL: string;
  public ELASTIC_APM_SERVER_URL: string;
  public ELASTIC_APM_SECRET_TOKEN: string;

  constructor() {
    this.ENABLE_APM = process.env.ENABLE_APM || '0';
    this.GATEWAY_JWT_TOKEN = process.env.GATEWAY_JWT_TOKEN || '';
    this.JWT_TOKEN = process.env.JWT_TOKEN || '';
    this.NODE_ENV = process.env.NODE_ENV || '';
    this.SECRET_KEY_ONE = process.env.SECRET_KEY_ONE || '';
    this.SECRET_KEY_TWO = process.env.SECRET_KEY_TWO || '';
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.AUTH_BASE_URL = process.env.AUTH_BASE_URL || '';
    this.URL_GENERATE_BASE_URL = process.env.URL_GENERATE_BASE_URL || '';
    this.URL_REDIRECT_BASE_URL = process.env.URL_REDIRECT_BASE_URL || '';
    this.ELASTIC_SEARCH_URL = process.env.ELASTIC_SEARCH_URL || '';
    this.ELASTIC_APM_SERVER_URL = process.env.ELASTIC_APM_SERVER_URL || '';
    this.ELASTIC_APM_SECRET_TOKEN = process.env.ELASTIC_APM_SECRET_TOKEN || '';
  }
}
