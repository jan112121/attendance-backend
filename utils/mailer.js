import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send email with plain text + HTML to reduce spam
 */
export async function sendEmailNotification(to, subject, message) {
  try {
    await sgMail.send({
      to,
      from: `"Attendance System" <${process.env.EMAIL_FROM}>`, // verified Gmail
      replyTo: process.env.EMAIL_FROM,
      subject,
      text: message,           // plain text version
      html: `<p>${message}</p>` // HTML version
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
