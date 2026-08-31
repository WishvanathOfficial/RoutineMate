import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

const resend = env.email.resendApiKey ? new Resend(env.email.resendApiKey) : null;

export async function sendMail(message: MailMessage): Promise<void> {
  if (!resend || !env.email.from) {
    logger.warn(`[mail] skipped: configure RESEND_API_KEY and EMAIL_FROM to send to ${message.to}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: env.email.from,
    to: [message.to],
    subject: message.subject,
    text: message.text,
  });

  if (error) {
    throw new Error(`Resend email failed: ${error.message}`);
  }

  logger.info(`[mail] sent to=${message.to} subject="${message.subject}"`);
}
