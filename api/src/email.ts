import nodemailer from 'nodemailer';

// Configure transporter based on environment variables or default to Mailpit (localhost:1025)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: Number(process.env.SMTP_PORT) || 1025,
    secure: false,
});

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
    try {
        const info = await transporter.sendMail({
            from: 'Atrium Coaching Centre <no-reply@atrium.local>',
            to,
            subject,
            text,
            html: html || text,
        });
        console.log(`[Email Sent] MessageId: ${info.messageId} to ${to}`);
        return true;
    } catch (err) {
        console.error(`[Email Error] Failed to send email to ${to}:`, err);
        return false;
    }
}