import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { config } from "src/config";

@Injectable()
export class CustomMailerService {
    constructor(private readonly mailerService: MailerService) { }

    async sendPasswordResetEmail(email: string, resetToken: string) {
        const resetLink = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;

        await this.mailerService.sendMail({
            to: email,
            subject: "🔐 Reset Your Password",
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>We received a request to reset your password. Click the button below to proceed:</p>
                    <a href="${resetLink}" style="display: inline-block; background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p style="margin-top: 20px;">If you did not request this, please ignore this email.</p>
                </div>
            </div>
            `,
        });

        return { message: "Password reset email sent successfully." };
    }

    async sendOtpEmail(email: string, otpCode: string) {
        await this.mailerService.sendMail({
            to: email,
            subject: "📩 Your One-Time Password (OTP)",
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333;">Your OTP Code</h2>
                    <p>Use the following one-time password to complete your registration:</p>
                    <div style="font-size: 24px; font-weight: bold; color: #007BFF; margin: 20px 0;">${otpCode}</div>
                    <p>This code is valid for 5 minutes. Please do not share it with anyone.</p>
                </div>
            </div>
            `,
        });

        return { message: "OTP sent successfully.", otp: otpCode };
    }

}
