import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create SendGrid transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,        // TLS
  secure: false,    // false for port 587
  auth: {
    user: 'apikey',                 // literally 'apikey'
    pass: process.env.SENDGRID_API_KEY,
  },
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SendGrid SMTP Connection Error:', error);
  } else {
    console.log('SendGrid SMTP is ready');
  }
});

// Send email function
export async function sendEmailNotification(to, subject, message) {
  try {
    await transporter.sendMail({
      from: `"Attendance System" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html: message,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
  }
}
