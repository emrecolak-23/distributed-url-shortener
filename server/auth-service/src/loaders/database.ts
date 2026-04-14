import { injectable, singleton } from 'tsyringe';
import { EnvConfig } from '@auth-service/configs';
import { Pool, QueryResultRow, QueryResult } from 'pg';
import { Logger } from 'winston';
import { winstonLogger } from '@emrecolak-23/jobber-share';

@singleton()
@injectable()
export class Database {
  private pool: Pool;
  private log: Logger = winstonLogger(`${this.config.ELASTIC_SEARCH_URL}`, 'authServiceElasticConnection', 'debug');
  constructor(private readonly config: EnvConfig) {
    this.pool = new Pool({
      database: this.config.POSTGRES_DB,
      user: this.config.POSTGRES_USER,
      password: this.config.POSTGRES_PASSWORD,
      host: this.config.POSTGRES_HOST,
      port: parseInt(this.config.POSTGRES_PORT),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ...(this.config.NODE_ENV === 'production' &&
        this.config.CLUSTER_TYPE !== 'local' &&
        this.config.CLUSTER_TYPE !== 'minikube' && {
          ssl: { rejectUnauthorized: false }
        })
    });

    this.registerEventHandlers();
  }

  async createTableText(): Promise<string> {
    return `
    CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL UNIQUE,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        emailVerified BOOLEAN DEFAULT FALSE,
        emailVerificationToken TEXT,
        emailVerificationTokenExpiresAt TIMESTAMP,
        passwordResetToken TEXT,
        passwordResetTokenExpiresAt TIMESTAMP,
        passwordResetAt TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_DATE NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_DATE NOT NULL,
        PRIMARY KEY (id)
    );
    `;
  }

  async connect(retries = 3, delay = 3000): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const client = await this.pool.connect();
        const createTableText = await this.createTableText();
        await this.pool.query(createTableText);
        client.release();
        this.log.info('AuthService connected to database successfully');
        return;
      } catch (error) {
        this.log.log('error', `AuthService databaseConnection() attempt ${attempt}/${retries} failed:`, error);
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    this.log.log('error', 'AuthService databaseConnection() all retry attempts exhausted');
  }

  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.log.info('AuthService disconnected from database successfully');
    } catch (error) {
      this.log.log('error', 'AuthService databaseDisconnect() method error:', error);
    }
  }

  private registerEventHandlers(): void {
    this.pool.on('error', (error) => {
      this.log.log('error', 'AuthService unexpected database error:', error);
    });
    this.pool.on('connect', () => this.log.info('AuthService Database connected'));
  }

  async query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }
}
