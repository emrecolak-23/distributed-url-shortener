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
  public API_GATEWAY_URL: string;
  public POSTGRES_DB: string;
  public POSTGRES_USER: string;
  public POSTGRES_PASSWORD: string;
  public POSTGRES_HOST: string;
  public POSTGRES_PORT: string;
  public CLUSTER_TYPE: string;
  public RABBITMQ_ENDPOINT: string;
  public ELASTIC_SEARCH_URL: string;

  constructor() {
    this.ENABLE_APM = process.env.ENABLE_APM || '0';
    this.GATEWAY_JWT_TOKEN = process.env.GATEWAY_JWT_TOKEN || '';
    this.JWT_TOKEN = process.env.JWT_TOKEN || '';
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.API_GATEWAY_URL = process.env.API_GATEWAY_URL || '';
    this.POSTGRES_DB = process.env.POSTGRES_DB || '';
    this.POSTGRES_USER = process.env.POSTGRES_USER || '';
    this.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || '';
    this.POSTGRES_HOST = process.env.POSTGRES_HOST || '';
    this.POSTGRES_PORT = process.env.POSTGRES_PORT || '';
    this.CLUSTER_TYPE = process.env.CLUSTER_TYPE || '';
    this.ELASTIC_SEARCH_URL = process.env.ELASTIC_SEARCH_URL || '';
    this.RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT || '';
  }
}
