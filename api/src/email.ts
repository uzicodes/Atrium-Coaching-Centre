import nodemailer from 'nodemailer';

let cachedTransporter: nodemailer.Transporter | null = null;

async function getTransporter() {
    if (cachedTransporter) return cachedTransporter;

    // If explicit SMTP credentials are provided, use them
    if (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'localhost') {
        cachedTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        return cachedTransporter;
    }

    // Otherwise, automatically generate a throwaway Ethereal test account on the fly!
    const testAccount = await nodemailer.createTestAccount();
    console.log(`[Ethereal] Created test account: ${testAccount.user}`);

    cachedTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    return cachedTransporter;
}

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
    try {
        const transporter = await getTransporter();
        const info = await transporter.sendMail({
            from: 'Atrium Coaching Centre <no-reply@atrium.local>',
            to,
            subject,
            text,
            html: html || text,
        });

        console.log(`[Email Sent] MessageId: ${info.messageId} to ${to}`);

        // Generate and log the Ethereal preview URL
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`[Ethereal Preview URL]: ${previewUrl}`);
        }

        return true;
    } catch (err) {
        console.error(`[Email Error] Failed to send email to ${to}:`, err);
        return false;
    }
}