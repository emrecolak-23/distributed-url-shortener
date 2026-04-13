import { winstonLogger } from '@emrecolak-23/jobber-share';
import { Logger } from 'winston';
import { EnvConfig } from '@auth-service/configs';
import { Client } from '@elastic/elasticsearch';
import { ClusterHealthResponse } from '@elastic/elasticsearch/lib/api/types';
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class ElasticSearch {
  log: Logger = winstonLogger(`${this.config.ELASTIC_SEARCH_URL}`, 'authServiceElasticConnection', 'debug');
  elasticSearchClient: Client;

  constructor(private readonly config: EnvConfig) {
    this.elasticSearchClient = new Client({
      node: `${config.ELASTIC_SEARCH_URL}`,
      requestTimeout: 60000,
      pingTimeout: 3000
    });
  }

  public async checkConnection(): Promise<void> {
    let isConnected = false;
    while (!isConnected) {
      try {
        this.log.info('AuthService Connecting to ElasticSearch...');
        const health: ClusterHealthResponse = await this.elasticSearchClient.cluster.health({});
        this.log.info(`AuthService ElasticSearch health status - ${health.status}`);
        isConnected = true;
      } catch (error) {
        this.log.error('Connection to ElasticSearch failed, retrying in 3 seconds...');
        this.log.log('error', 'AuthService checkConnection method error: ', error);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
}
