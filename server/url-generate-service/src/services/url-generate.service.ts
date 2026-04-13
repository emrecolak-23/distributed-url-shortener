import { injectable, singleton } from 'tsyringe';
import { ZooKeeper } from '@url-generate-service/loaders/zookeeper';
import { Cassandra } from '@url-generate-service/loaders/cassandra';
import { EnvConfig } from '@url-generate-service/config';

@singleton()
@injectable()
export class UrlGenerateService {
  constructor(
    private readonly zookeeper: ZooKeeper,
    private readonly cassandra: Cassandra,
    private readonly config: EnvConfig
  ) {}

  public async generateUrl(url: string): Promise<string> {
    const shortId = this.zookeeper.generateId();

    await this.cassandra
      .getClient()
      .execute('INSERT INTO urls (short_id, original_url, created_at) VALUES (?, ?, ?)', [shortId, url, new Date()], {
        prepare: true
      });

    return `${this.config.SHORT_URL_PREFIX}${shortId}`;
  }
}
