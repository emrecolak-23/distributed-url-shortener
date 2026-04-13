export interface IEmailMessageDetail {
  receiverEmail: string;
  verifyLink?: string;
  resetLink?: string;
  username?: string;
  template: string;
  messageId: string;
}
