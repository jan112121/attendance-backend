import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmailNotification(to, subject, message) {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM, // must be verified in SendGrid
      subject,
      html: message,
    };

    await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email via SendGrid API:', error);
  }
}
