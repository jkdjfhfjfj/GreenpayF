import fetch from 'node-fetch';
import { storage } from '../storage';
import { emailService } from './email';
import { whatsappService } from './whatsapp';

interface MessageResponse {
  status_code: number;
  message: string;
}

interface MessagingCredentials {
  apiKey: string;
  accountEmail: string;
  senderId: string;
}

export class MessagingService {
  private readonly SMS_URL = 'https://talkntalk.africa/api/v1/sms/send';
  private readonly MAX_MESSAGE_LENGTH = 160;
  private readonly MESSAGE_PREFIX = '[Greenpay] ';

  /**
   * Get messaging credentials from system settings
   */
  private async getCredentials(): Promise<MessagingCredentials | null> {
    try {
      const settings = await storage.getSystemSettingsByCategory('messaging');
      
      const apiKey = settings.find((s: any) => s.key === 'api_key')?.value as string;
      const accountEmail = settings.find((s: any) => s.key === 'account_email')?.value as string;
      const senderId = settings.find((s: any) => s.key === 'sender_id')?.value as string;

      if (!apiKey || !accountEmail || !senderId) {
        console.warn('SMS messaging credentials not fully configured');
        return null;
      }

      return { apiKey, accountEmail, senderId };
    } catch (error) {
      console.error('Error fetching messaging credentials:', error);
      return null;
    }
  }

  /**
   * Format phone number to Kenya format (+254XXXXXXXXX)
   * Handles: +254xxx, 00254xxx, 0xxx, 254xxx, 7xxx, 1xxx
   * Always returns phone with + prefix for database consistency
   */
  formatPhoneNumber(phone: string): string {
    // Remove any whitespace and special characters except +
    let cleaned = phone.replace(/[\s-()]/g, '');
    
    // Handle international prefix "00" (e.g., 00254712345678)
    if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2);
    }
    
    // Remove leading + if present temporarily
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // Handle different formats
    if (cleaned.startsWith('254')) {
      // Already in correct format, just add +
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      // Replace leading 0 with 254
      return '+254' + cleaned.substring(1);
    } else if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
      // Add 254 prefix for local numbers
      return '+254' + cleaned;
    }
    
    // Return with + prefix even if format is unclear
    return '+' + cleaned;
  }

  /**
   * Truncate message to fit within character limit (including prefix)
   */
  private formatMessage(message: string): string {
    const fullMessage = this.MESSAGE_PREFIX + message;
    
    if (fullMessage.length > this.MAX_MESSAGE_LENGTH) {
      const availableLength = this.MAX_MESSAGE_LENGTH - this.MESSAGE_PREFIX.length - 3; // -3 for "..."
      return this.MESSAGE_PREFIX + message.substring(0, availableLength) + '...';
    }
    
    return fullMessage;
  }

  /**
   * Send SMS message
   */
  private async sendSMS(phone: string, message: string, credentials: MessagingCredentials): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const formattedMessage = this.formatMessage(message);

      const response = await fetch(this.SMS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': credentials.apiKey,
          'X-Account-Email': credentials.accountEmail,
        },
        body: JSON.stringify({
          sender_id: credentials.senderId,
          recipient: formattedPhone,
          message: formattedMessage,
        }),
      });

      const result = await response.json() as MessageResponse;
      
      if (result.status_code === 200) {
        console.log(`SMS sent successfully to ${formattedPhone}`);
        return true;
      } else {
        console.error(`SMS send failed: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      return false;
    }
  }

  /**
   * Send WhatsApp message via Meta WhatsApp Business API
   */
  private async sendWhatsApp(phone: string, message: string): Promise<boolean> {
    try {
      if (!whatsappService.isConfigured()) {
        console.warn('WhatsApp Business API not configured');
        return false;
      }

      const formattedMessage = this.formatMessage(message);
      return await whatsappService.sendTextMessage(phone, formattedMessage);
    } catch (error) {
      console.error('WhatsApp sending error:', error);
      return false;
    }
  }

  /**
   * Send message concurrently via SMS and WhatsApp
   */
  async sendMessage(phone: string, message: string): Promise<{ sms: boolean; whatsapp: boolean }> {
    const credentials = await this.getCredentials();
    
    // SMS requires credentials, WhatsApp uses env vars (can work independently)
    let smsResult = false;
    let whatsappResult = false;

    // Send SMS if credentials are configured
    if (credentials) {
      smsResult = await this.sendSMS(phone, message, credentials);
    } else {
      console.warn('SMS credentials not configured, skipping SMS');
    }

    // Send WhatsApp (uses env vars via whatsappService)
    whatsappResult = await this.sendWhatsApp(phone, message);

    return { sms: smsResult, whatsapp: whatsappResult };
  }

  /**
   * Send message to all channels (SMS, WhatsApp, and Email)
   */
  async sendMultiChannelMessage(
    phone: string, 
    email: string | undefined,
    message: string
  ): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const credentials = await this.getCredentials();
    
    const results = {
      sms: false,
      whatsapp: false,
      email: false
    };

    // Send via SMS if configured
    if (credentials) {
      results.sms = await this.sendSMS(phone, message, credentials);
    } else {
      console.warn('SMS credentials not configured, skipping SMS');
    }

    // Send via WhatsApp (uses Meta API via env vars)
    results.whatsapp = await this.sendWhatsApp(phone, message);

    // Send via email if email address is provided
    if (email) {
      // Email will be sent via specific methods with HTML templates
      console.log('Email will be sent via specialized emailService methods');
      results.email = true; // Will be set by specific email methods
    }

    return results;
  }

  /**
   * Send OTP verification code via SMS, WhatsApp, and Email
   */
  async sendOTP(phone: string, otpCode: string, email?: string, userName?: string): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const message = `Your verification code is ${otpCode}. Valid for 10 minutes.`;
    
    // Send via SMS and WhatsApp
    const mobileResult = await this.sendMessage(phone, message);
    
    // Send via Email if provided
    let emailResult = false;
    if (email) {
      emailResult = await emailService.sendOTP(email, otpCode, userName);
    }
    
    return { 
      sms: mobileResult.sms, 
      whatsapp: mobileResult.whatsapp,
      email: emailResult
    };
  }

  /**
   * Send password reset code via SMS, WhatsApp, and Email
   */
  async sendPasswordReset(phone: string, resetCode: string, email?: string, userName?: string): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const message = `Your password reset code is ${resetCode}. Valid for 10 minutes.`;
    
    // Send via SMS and WhatsApp
    const mobileResult = await this.sendMessage(phone, message);
    
    // Send via Email if provided
    let emailResult = false;
    if (email) {
      emailResult = await emailService.sendPasswordReset(email, resetCode, userName);
    }
    
    return { 
      sms: mobileResult.sms, 
      whatsapp: mobileResult.whatsapp,
      email: emailResult
    };
  }

  /**
   * Send fund receipt notification via SMS, WhatsApp, and Email
   */
  async sendFundReceipt(phone: string, amount: string, currency: string, sender: string, email?: string, userName?: string): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const message = `You received ${currency} ${amount} from ${sender}. Check your account.`;
    
    // Send via SMS and WhatsApp
    const mobileResult = await this.sendMessage(phone, message);
    
    // Send via Email if provided
    let emailResult = false;
    if (email) {
      emailResult = await emailService.sendFundReceipt(email, amount, currency, sender, userName);
    }
    
    return { 
      sms: mobileResult.sms, 
      whatsapp: mobileResult.whatsapp,
      email: emailResult
    };
  }

  /**
   * Send login alert with location and IP via SMS, WhatsApp, and Email
   */
  async sendLoginAlert(phone: string, location: string, ip: string, email?: string, userName?: string): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const message = `New login from ${location} (IP: ${ip}). Not you? Contact support.`;
    const timestamp = new Date().toLocaleString('en-US', { 
      dateStyle: 'long', 
      timeStyle: 'short' 
    });
    
    // Send via SMS and WhatsApp
    const mobileResult = await this.sendMessage(phone, message);
    
    // Send via Email if provided
    let emailResult = false;
    if (email) {
      emailResult = await emailService.sendLoginAlert(email, location, ip, timestamp, userName);
    }
    
    return { 
      sms: mobileResult.sms, 
      whatsapp: mobileResult.whatsapp,
      email: emailResult
    };
  }

  /**
   * Send KYC verified notification via SMS, WhatsApp, and Email
   */
  async sendKYCVerified(phone: string, email?: string, userName?: string): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const message = `Your account is now verified! You can now access all features.`;
    
    // Send via SMS and WhatsApp
    const mobileResult = await this.sendMessage(phone, message);
    
    // Send via Email if provided
    let emailResult = false;
    if (email && userName) {
      emailResult = await emailService.sendKYCVerified(email, userName);
    }
    
    return { 
      sms: mobileResult.sms, 
      whatsapp: mobileResult.whatsapp,
      email: emailResult
    };
  }

  /**
   * Send card activation notification via SMS, WhatsApp, and Email
   */
  async sendCardActivation(phone: string, cardLastFour: string, email?: string, userName?: string): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const message = `Your virtual card ending in ${cardLastFour} is now active!`;
    
    // Send via SMS and WhatsApp
    const mobileResult = await this.sendMessage(phone, message);
    
    // Send via Email if provided
    let emailResult = false;
    if (email) {
      emailResult = await emailService.sendCardActivation(email, cardLastFour, userName);
    }
    
    return { 
      sms: mobileResult.sms, 
      whatsapp: mobileResult.whatsapp,
      email: emailResult
    };
  }

  /**
   * Send transaction notification via SMS, WhatsApp, and Email
   */
  async sendTransactionNotification(
    phone: string, 
    type: string, 
    amount: string, 
    currency: string, 
    status: string,
    transactionId?: string,
    email?: string,
    userName?: string
  ): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const action = type === 'withdraw' ? 'Withdrawal' : type === 'send' ? 'Transfer' : 'Transaction';
    const message = `${action} of ${currency} ${amount} ${status}. Check your account for details.`;
    
    // Send via SMS and WhatsApp
    const mobileResult = await this.sendMessage(phone, message);
    
    // Send via Email if provided
    let emailResult = false;
    if (email && transactionId) {
      emailResult = await emailService.sendTransactionNotification(
        email, type, amount, currency, status, transactionId, userName
      );
    }
    
    return { 
      sms: mobileResult.sms, 
      whatsapp: mobileResult.whatsapp,
      email: emailResult
    };
  }

  /**
   * Generate 6-digit OTP code
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export const messagingService = new MessagingService();
