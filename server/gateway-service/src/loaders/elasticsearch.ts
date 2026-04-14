import { winstonLogger } from '@emrecolak-23/jobber-share';
import { Logger } from 'winston';
import { EnvConfig } from '@gateway-service/configs';
import { Client, estypes } from '@elastic/elasticsearch';
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class ElasticSearch {
  log: Logger = winstonLogger(`${this.config.ELASTIC_SEARCH_URL}`, 'apiGatewayElasticConnection', 'debug');
  private elasticSearchClient: Client;

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
        this.log.info('GatewayService Connecting to ElasticSearch...');
        const health: estypes.ClusterHealthResponse = await this.elasticSearchClient.cluster.health({});
        this.log.info(`GatewayService ElasticSearch health status - ${health.status}`);
        isConnected = true;
      } catch (error) {
        this.log.error('Connection to ElasticSearch failed, retrying in 3 seconds...');
        this.log.log('error', 'GatewayService checkConnection method error: ', error);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
}
