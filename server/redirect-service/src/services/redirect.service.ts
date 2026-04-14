import { injectable, singleton } from 'tsyringe';
import { Cassandra, Redis } from '@redirect-service/loaders';

@singleton()
@injectable()
export class RedirectService {
  private readonly CACHE_THRESHOLD = 5;
  private readonly CACHE_TTL = 60 * 60 * 24;
  private readonly COUNTER_TTL = 60 * 60;

  constructor(
    private readonly cassandra: Cassandra,
    private readonly redis: Redis
  ) {}

  public async redirect(shortId: string): Promise<string | null> {
    const cachedUrl = await this.redis.redisClient.get(`url:${shortId}`);
    if (cachedUrl) {
      return cachedUrl;
    }

    const result = await this.cassandra
      .getClient()
      .execute('SELECT original_url FROM urls WHERE short_id = ?', [shortId], { prepare: true });

    if (!result.rows.length) {
      throw new Error('URL not found');
    }

    const originalUrl = result.rows[0].original_url;

    const hitCount = await this.redis.redisClient.incr(`hits:${shortId}`);

    if (hitCount === 1) {
      await this.redis.redisClient.expire(`hits:${shortId}`, this.COUNTER_TTL);
    }

    if (hitCount >= this.CACHE_THRESHOLD) {
      await this.redis.redisClient.setEx(`url:${shortId}`, this.CACHE_TTL, originalUrl);
    }

    return originalUrl;
  }
}
