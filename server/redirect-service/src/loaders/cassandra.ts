import { winstonLogger } from '@emrecolak-23/jobber-share';
import { Client } from 'cassandra-driver';
import { injectable, singleton } from 'tsyringe';
import { EnvConfig } from '@redirect-service/configs';
import { Logger } from 'winston';

@singleton()
@injectable()
export class Cassandra {
  public getClient(): Client {
    return this.client;
  }
  private log: Logger = winstonLogger(`${this.config.ELASTIC_SEARCH_URL}`, 'urlGenerateServiceCassandraConnection', 'debug');
  private client: Client;
  private keyspace: string;

  constructor(private readonly config: EnvConfig) {
    const cassandraUrl = new URL(this.config.DATABASE_URL);
    this.keyspace = cassandraUrl.pathname.replace('/', '') || 'url_shortener';

    this.client = new Client({
      contactPoints: [`${cassandraUrl.hostname}:${cassandraUrl.port || '9042'}`],
      localDataCenter: 'datacenter1'
    });
  }

  async connect() {
    try {
      await this.client.connect();
      this.log.info('UrlGenerateService Cassandra connection successful');

      await this.client.execute(`
          CREATE KEYSPACE IF NOT EXISTS ${this.keyspace}
          WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
        `);

      await this.client.execute(`USE ${this.keyspace}`);
    } catch (err) {
      this.log.error('UrlGenerateService Cassandra connection error: ', err);
    }
  }
}
