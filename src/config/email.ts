import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();

const port =  Number(process.env.SMTP_PORT)
const host = process.env.SMTP_HOST as string
const user = process.env.SMTP_USER as string
const pass = process.env.SMTP_PASS as string
const from = process.env.EMAIL_FROM as string

const sendEmail = async (to: string, subject: string, html: string) => {
    if(!port || !host || !pass || !user){
        throw new Error('Missing email env variables');
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: {
                user,
                pass
            }
        });

        await transporter.sendMail({
            from,
            to,
            subject,
            html
        });

        console.log('Email sent')
    } catch (error) {
        console.log('Error sending email');
        return;
    }
}

export default sendEmail;