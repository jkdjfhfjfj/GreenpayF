import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { storage } from '../storage';
import { emailTemplates } from './email-templates';

interface EmailCredentials {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private credentials: EmailCredentials | null = null;

  /**
   * Get email credentials from system settings
   */
  private async getCredentials(): Promise<EmailCredentials | null> {
    try {
      const settings = await storage.getSystemSettingsByCategory('email');
      
      const host = settings.find((s: any) => s.key === 'smtp_host')?.value as string;
      const port = parseInt(settings.find((s: any) => s.key === 'smtp_port')?.value as string || '465');
      const secure = settings.find((s: any) => s.key === 'smtp_secure')?.value === 'true';
      const username = settings.find((s: any) => s.key === 'smtp_username')?.value as string;
      const password = settings.find((s: any) => s.key === 'smtp_password')?.value as string;
      const fromEmail = settings.find((s: any) => s.key === 'from_email')?.value as string;
      const fromName = settings.find((s: any) => s.key === 'from_name')?.value as string || 'GreenPay';

      if (!host || !username || !password || !fromEmail) {
        console.warn('Email credentials not fully configured');
        return null;
      }

      return { host, port, secure, username, password, fromEmail, fromName };
    } catch (error) {
      console.error('Error fetching email credentials:', error);
      return null;
    }
  }

  /**
   * Initialize or refresh the SMTP transporter
   */
  private async initializeTransporter(): Promise<boolean> {
    try {
      this.credentials = await this.getCredentials();
      
      if (!this.credentials) {
        return false;
      }

      this.transporter = nodemailer.createTransport({
        host: this.credentials.host,
        port: this.credentials.port,
        secure: this.credentials.secure,
        auth: {
          user: this.credentials.username,
          pass: this.credentials.password,
        },
      });

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
      return true;
    } catch (error) {
      console.error('Email service initialization failed:', error);
      this.transporter = null;
      return false;
    }
  }

  /**
   * Send an email
   */
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      // Ensure transporter is initialized
      if (!this.transporter) {
        const initialized = await this.initializeTransporter();
        if (!initialized || !this.transporter || !this.credentials) {
          console.warn('Email not sent: Service not configured');
          return false;
        }
      }

      // Ensure credentials are available
      if (!this.credentials) {
        this.credentials = await this.getCredentials();
        if (!this.credentials) {
          return false;
        }
      }

      const mailOptions = {
        from: `${this.credentials.fromName} <${this.credentials.fromEmail}>`,
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to} - MessageId: ${info.messageId}`);
      return true;
    } catch (error: any) {
      // If authentication fails, try to reinitialize
      if (error.code === 'EAUTH' || error.responseCode === 535) {
        console.log('Email auth failed, reinitializing transporter...');
        const initialized = await this.initializeTransporter();
        if (initialized && this.transporter) {
          try {
            const mailOptions = {
              from: `${this.credentials?.fromName} <${this.credentials?.fromEmail}>`,
              to,
              subject,
              html,
            };
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to ${to} (after reinit)`);
            return true;
          } catch (retryError) {
            console.error('Email sending error after reinit:', retryError);
            return false;
          }
        }
      }
      
      console.error('Email sending error:', error);
      return false;
    }
  }

  /**
   * Send OTP verification code
   */
  async sendOTP(email: string, otpCode: string, userName?: string): Promise<boolean> {
    const subject = 'Your GreenPay Verification Code';
    const html = emailTemplates.otp(otpCode, userName);
    return this.sendEmail(email, subject, html);
  }

  /**
   * Send password reset code
   */
  async sendPasswordReset(email: string, resetCode: string, userName?: string): Promise<boolean> {
    const subject = 'Reset Your GreenPay Password';
    const html = emailTemplates.passwordReset(resetCode, userName);
    return this.sendEmail(email, subject, html);
  }

  /**
   * Send welcome email
   */
  async sendWelcome(email: string, userName: string): Promise<boolean> {
    const subject = 'Welcome to GreenPay! 🎉';
    const html = emailTemplates.welcome(userName);
    return this.sendEmail(email, subject, html);
  }

  /**
   * Send fund receipt notification
   */
  async sendFundReceipt(email: string, amount: string, currency: string, sender: string, userName?: string): Promise<boolean> {
    const subject = `You've Received ${currency} ${amount}`;
    const html = emailTemplates.fundReceipt(amount, currency, sender, userName);
    return this.sendEmail(email, subject, html);
  }

  /**
   * Send transaction notification
   */
  async sendTransactionNotification(
    email: string, 
    type: string, 
    amount: string, 
    currency: string, 
    status: string,
    transactionId: string,
    userName?: string
  ): Promise<boolean> {
    const action = type === 'withdraw' ? 'Withdrawal' : type === 'send' ? 'Transfer' : 'Transaction';
    const subject = `${action} ${status === 'completed' ? 'Completed' : 'Update'}: ${currency} ${amount}`;
    const html = emailTemplates.transaction(type, amount, currency, status, transactionId, userName);
    return this.sendEmail(email, subject, html);
  }

  /**
   * Send login alert
   */
  async sendLoginAlert(email: string, location: string, ip: string, timestamp: string, userName?: string): Promise<boolean> {
    const subject = '🔐 New Login to Your GreenPay Account';
    const html = emailTemplates.loginAlert(location, ip, timestamp, userName);
    return this.sendEmail(email, subject, html);
  }

  /**
   * Send KYC verified notification
   */
  async sendKYCVerified(email: string, userName: string): Promise<boolean> {
    const subject = '✅ Your Account is Now Verified!';
    const html = emailTemplates.kycVerified(userName);
    return this.sendEmail(email, subject, html);
  }

  /**
   * Send card activation notification
   */
  async sendCardActivation(email: string, cardLastFour: string, userName?: string): Promise<boolean> {
    const subject = '💳 Your Virtual Card is Active!';
    const html = emailTemplates.cardActivation(cardLastFour, userName);
    return this.sendEmail(email, subject, html);
  }

  /**
   * Send test email (for admin configuration testing)
   */
  async sendTestEmail(email: string): Promise<boolean> {
    const subject = 'Test Email from GreenPay';
    const html = emailTemplates.test();
    return this.sendEmail(email, subject, html);
  }

  /**
   * Verify email configuration
   */
  async verifyConfiguration(): Promise<boolean> {
    return await this.initializeTransporter();
  }
}

export const emailService = new EmailService();
