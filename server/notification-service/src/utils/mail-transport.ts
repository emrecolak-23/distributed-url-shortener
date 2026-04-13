import { Logger } from 'winston';
import { IEmailLocals, winstonLogger } from '@emrecolak-23/jobber-share';
import { EnvConfig } from '@notification-service/configs';
import { EmailTemplates } from '@notification-service/utils/email-templates';
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class MailTransport {
  private log: Logger = winstonLogger(`${this.config.ELASTIC_SEARCH_URL}`, 'mailTransports', 'debug');
  constructor(
    private readonly config: EnvConfig,
    private readonly emailTemplates: EmailTemplates
  ) {}

  public async sendEmail(template: string, receiverEmail: string, locals: IEmailLocals): Promise<void> {
    try {
      await this.emailTemplates.send(template, receiverEmail, locals);
      this.log.info('Email sent successfully');
    } catch (error) {
      this.log.log('error', 'NotificationService MailTransport sendEmail() method error:', error);
    }
  }
}
