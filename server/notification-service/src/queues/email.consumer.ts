import { Channel, ConsumeMessage } from 'amqplib';
import { injectable, singleton } from 'tsyringe';
import { Logger } from 'winston';
import { IEmailLocals, winstonLogger } from '@emrecolak-23/jobber-share';
import { EnvConfig } from '@notification-service/configs';
import { MailTransport } from '@notification-service/utils/mail-transport';
import { IdempotencyService } from '@notification-service/services/idempotency.service';

@singleton()
@injectable()
export class EmailConsumer {
  private log: Logger = winstonLogger(`${this.config.ELASTIC_SEARCH_URL}`, 'notificationEmailConsumer', 'debug');

  constructor(
    private readonly config: EnvConfig,
    private readonly mailTransport: MailTransport,
    private readonly idempotencyService: IdempotencyService
  ) {}

  public async consumeAuthEmailMessages(channel: Channel): Promise<void> {
    await this.setupEmailConsumer(channel, 'jobber-email-notification', 'auth-email', 'auth-email-queue', async (msg) => {
      const data = JSON.parse(msg.content.toString());
      const { receiverEmail, username, verifyLink, resetLink, template, messageId } = data;
      const uniqueMessageId = messageId ?? msg.properties.messageId;

      if (!uniqueMessageId) {
        this.log.error('Auth email message missing messageId field', { data });
        return;
      }

      const alreadyProcessed = await this.idempotencyService.isProcessed(uniqueMessageId);
      if (alreadyProcessed) {
        this.log.warn(`Duplicate auth email message skipped: ${uniqueMessageId}`);
        return;
      }

      if (!template) {
        this.log.error('Auth email message missing template field', { data });
        return;
      }

      const locals: IEmailLocals = {
        appLink: `${this.config.CLIENT_URL}`,
        appIcon: 'https://i.ibb.co/rR9tGcrZ/jobber3057-logowik-com.webp',
        username,
        verifyLink,
        resetLink
      };

      await this.mailTransport.sendEmail(template, receiverEmail, locals);
      await this.idempotencyService.markAsProcessed(uniqueMessageId, { receiverEmail, template });
      this.log.info(`Auth Email Data: ${JSON.stringify(data)}`);
    });
  }

  private async setupEmailConsumer(
    channel: Channel,
    exchangeName: string,
    routingKey: string,
    queueName: string,
    onMessage: (msg: ConsumeMessage) => Promise<void>
  ): Promise<void> {
    await channel.assertExchange(exchangeName, 'direct', { durable: true });
    const assertedQueue = await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(assertedQueue.queue, exchangeName, routingKey);

    channel.consume(assertedQueue.queue, async (msg) => {
      if (!msg) {
        return;
      }

      try {
        await onMessage(msg);
        channel.ack(msg);
      } catch (error) {
        this.log.error('NotificationService email consumer processing error:', error);
        channel.nack(msg, false, false);
      }
    });
  }
}
