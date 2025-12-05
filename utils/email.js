import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

export async function sendEmailNotification(to, subject, message) {
    try {
        await transporter.sendMail({
            from: `"Attendance System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: message,
        })
        console.log(`Email sent to ${to}`)
    } catch (error) {
        console.error('Error sending email', error)
    }
}