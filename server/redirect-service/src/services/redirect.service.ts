import { injectable, singleton } from 'tsyringe';
import { Cassandra, Redis } from '@redirect-service/loaders';

@singleton()
@injectable()
export class RedirectService {
  constructor(
    private readonly cassandra: Cassandra,
    private readonly redis: Redis
  ) {}

  public async redirect(shortId: string): Promise<string | null> {
    const cachedUrl = await this.redis.redisClient.get(shortId);
    if (cachedUrl) {
      return cachedUrl;
    }

    const url = await this.cassandra.getClient().execute('SELECT original_url FROM urls WHERE short_id = ?', [shortId]);
    if (!url) {
      throw new Error('URL not found');
    }

    await this.redis.redisClient.setEx(shortId, 60 * 60 * 24 * 30, url.rows[0].original_url);
    return url.rows[0].original_url;
  }
}
