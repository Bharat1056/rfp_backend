import sgMail from '@sendgrid/mail';
import { EmailOptions } from '../types';

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  console.error('SENDGRID_API_KEY is not set in environment variables');
} else {
  sgMail.setApiKey(apiKey);
}


export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  from,
  cc,
  bcc,
  replyTo,
  attachments,
}: EmailOptions) => {
  try {
    const msg = {
      to,
      from: from || process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
      subject,
      text: text || '',
      html,
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(replyTo && { replyTo }),
      ...(attachments && { attachments }),
    };

    const response = await sgMail.send(msg);

    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      statusCode: response[0].statusCode,
    };
  } catch (error: any) {
    console.error('❌ SendGrid email sending failed:', error);

    if (error.response) {
      console.error('   Error details:', error.response.body);
    }

    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export const sendBulkEmails = async (emails: EmailOptions[]) => {
  try {
    const messages = emails.map((email) => ({
      to: email.to,
      from: email.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
      subject: email.subject,
      text: email.text || '',
      html: email.html,
      ...(email.cc && { cc: email.cc }),
      ...(email.bcc && { bcc: email.bcc }),
      ...(email.replyTo && { replyTo: email.replyTo }),
      ...(email.attachments && { attachments: email.attachments }),
    }));

    const response = await sgMail.send(messages);

    return {
      success: true,
      count: emails.length,
      statusCode: response[0].statusCode,
    };
  } catch (error: any) {
    if (error.response) {
      console.error('   Error details:', error.response.body);
    }

    throw new Error(`Failed to send bulk emails: ${error.message}`);
  }
};
