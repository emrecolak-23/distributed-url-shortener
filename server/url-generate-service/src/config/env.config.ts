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
  public CLIENT_URL: string;
  public REDIS_HOST: string;
  public API_GATEWAY_URL: string;
  public RABBITMQ_ENDPOINT: string;
  public DATABASE_URL: string;
  public STRIPE_API_KEY: string;
  public CLOUD_NAME: string;
  public CLOUD_API_KEY: string;
  public CLOUD_API_SECRET: string;
  public ELASTIC_SEARCH_URL: string;
  public ELASTIC_APM_SERVER_URL: string;
  public ELASTIC_APM_SECRET_TOKEN: string;

  constructor() {
    this.ENABLE_APM = process.env.ENABLE_APM || '0';
    this.GATEWAY_JWT_TOKEN = process.env.GATEWAY_JWT_TOKEN || '';
    this.JWT_TOKEN = process.env.JWT_TOKEN || '';
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.REDIS_HOST = process.env.REDIS_HOST || '';
    this.API_GATEWAY_URL = process.env.API_GATEWAY_URL || '';
    this.STRIPE_API_KEY = process.env.STRIPE_API_KEY || '';
    this.RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT || '';
    this.DATABASE_URL = process.env.DATABASE_URL || '';
    this.CLOUD_NAME = process.env.CLOUD_NAME || '';
    this.CLOUD_API_KEY = process.env.CLOUD_API_KEY || '';
    this.CLOUD_API_SECRET = process.env.CLOUD_API_SECRET || '';
    this.ELASTIC_SEARCH_URL = process.env.ELASTIC_SEARCH_URL || '';
    this.ELASTIC_APM_SERVER_URL = process.env.ELASTIC_APM_SERVER_URL || '';
    this.ELASTIC_APM_SECRET_TOKEN = process.env.ELASTIC_APM_SECRET_TOKEN || '';
  }
}
