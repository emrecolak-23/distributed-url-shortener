import { Logger } from 'winston';
import { IEmailLocals, winstonLogger } from '@emrecolak-23/jobber-share';
import nodemailer, { Transporter } from 'nodemailer';
import Email from 'email-templates';
import * as path from 'path';
import { EnvConfig } from '@notification-service/configs';
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class EmailTemplates {
  private log: Logger = winstonLogger(`${this.config.ELASTIC_SEARCH_URL}`, 'mailTransportHelper', 'debug');
  constructor(private readonly config: EnvConfig) {}

  public async send(template: string, receiver: string, locals: IEmailLocals): Promise<void> {
    if (!template || typeof template !== 'string') {
      throw new Error(`emailTemplates: template must be a non-empty string, received: ${typeof template}`);
    }
    try {
      const smtpTransport: Transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: this.config.SENDER_EMAIL,
          pass: this.config.SENDER_EMAIL_PASSWORD
        }
      });

      const email = new Email({
        message: {
          from: `Jobber APP <${this.config.SENDER_EMAIL}>`
        },
        send: true,
        transport: smtpTransport,
        preview: false,
        views: {
          options: {
            extension: 'ejs'
          }
        },
        juice: true,
        juiceResources: {
          preserveImportant: true,
          webResources: {
            relativeTo: path.join(__dirname, '../build')
          }
        }
      });

      await email.send({
        template: path.join(__dirname, '..', 'src/emails', template),
        message: {
          to: receiver
        },
        locals
      });
    } catch (error) {
      this.log.log('error', 'NotificationService emailTemplates() method error:', error);
    }
  }
}
