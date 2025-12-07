import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your Gmail
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
  port: 465,      // SSL
  secure: true,   // true for SSL
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Gmail SMTP Connection Error:', error);
  } else {
    console.log('Gmail SMTP is ready to send emails');
  }
});

// Send email function
export async function sendEmailNotification(to, subject, message) {
  try {
    await transporter.sendMail({
      from: `"Attendance System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: message,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
