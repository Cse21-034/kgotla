import nodemailer from "nodemailer";
import { env } from "../config/env";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${env.FROM_NAME}" <${env.FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new Error("Failed to send email");
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string, code: string): Promise<void> {
    const subject = "Verify your Kgotla account";
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Kgotla</h1>
          <p style="color: #64748b; margin: 5px 0;">Traditional meeting place for modern voices</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #1e293b; margin-top: 0;">Verify your email address</h2>
          <p style="color: #475569; line-height: 1.6;">
            Welcome to Kgotla! To complete your registration and start participating in discussions, 
            please verify your email address using the code below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #2563eb; color: white; padding: 15px 30px; border-radius: 6px; 
                        font-size: 24px; font-weight: bold; letter-spacing: 3px; display: inline-block;">
              ${code}
            </div>
          </div>
          
          <p style="color: #475569; line-height: 1.6;">
            This verification code will expire in 10 minutes. If you didn't create a Kgotla account, 
            you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; color: #94a3b8; font-size: 14px;">
          <p>© 2024 Kgotla. All rights reserved.</p>
        </div>
      </div>
    `;
    
    const text = `
      Kgotla Email Verification
      
      Welcome to Kgotla! Please verify your email address using this code: ${code}
      
      This code will expire in 10 minutes.
      
      If you didn't create a Kgotla account, you can safely ignore this email.
    `;

    await this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    const subject = "Reset your Kgotla password";
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Kgotla</h1>
          <p style="color: #64748b; margin: 5px 0;">Traditional meeting place for modern voices</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #1e293b; margin-top: 0;">Reset your password</h2>
          <p style="color: #475569; line-height: 1.6;">
            We received a request to reset the password for your Kgotla account. 
            Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #2563eb; color: white; padding: 12px 30px; border-radius: 6px; 
                      text-decoration: none; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #475569; line-height: 1.6;">
            This reset link will expire in 1 hour. If you didn't request a password reset, 
            you can safely ignore this email. Your password will remain unchanged.
          </p>
          
          <p style="color: #94a3b8; font-size: 14px; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:
            <br>
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; color: #94a3b8; font-size: 14px;">
          <p>© 2024 Kgotla. All rights reserved.</p>
        </div>
      </div>
    `;
    
    const text = `
      Kgotla Password Reset
      
      We received a request to reset your password. Click this link to reset it:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, you can safely ignore this email.
    `;

    await this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const subject = "Welcome to Kgotla! 🎉";
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Kgotla</h1>
          <p style="color: #64748b; margin: 5px 0;">Traditional meeting place for modern voices</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${firstName}! 🎉</h2>
          <p style="color: #475569; line-height: 1.6;">
            Your Kgotla account has been successfully created! You're now part of a vibrant community 
            where traditional values meet modern discussions.
          </p>
          
          <h3 style="color: #1e293b; margin-top: 25px;">What you can do on Kgotla:</h3>
          <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
            <li>💬 Participate in meaningful discussions</li>
            <li>🏘️ Join or create community groups</li>
            <li>💝 Tip content creators you appreciate</li>
            <li>🏪 Buy and sell in the marketplace</li>
            <li>⭐ Earn wisdom points for helpful contributions</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.CLIENT_URL}" 
               style="background: #2563eb; color: white; padding: 12px 30px; border-radius: 6px; 
                      text-decoration: none; font-weight: bold; display: inline-block;">
              Start Exploring
            </a>
          </div>
        </div>
        
        <div style="text-align: center; color: #94a3b8; font-size: 14px;">
          <p>© 2024 Kgotla. All rights reserved.</p>
        </div>
      </div>
    `;
    
    const text = `
      Welcome to Kgotla, ${firstName}!
      
      Your account has been successfully created. Visit ${env.CLIENT_URL} to start exploring.
      
      What you can do on Kgotla:
      - Participate in meaningful discussions
      - Join or create community groups  
      - Tip content creators you appreciate
      - Buy and sell in the marketplace
      - Earn wisdom points for helpful contributions
    `;

    await this.sendEmail({ to: email, subject, html, text });
  }
}

export const emailService = new EmailService();