import fetch from 'node-fetch';
import { storage } from '../storage';

interface MessageResponse {
  status_code: number;
  message: string;
}

interface MessagingCredentials {
  apiKey: string;
  accountEmail: string;
  senderId: string;
  whatsappSessionId: string;
}

export class MessagingService {
  private readonly SMS_URL = 'https://talkntalk.africa/api/v1/sms/send';
  private readonly WHATSAPP_URL_BASE = 'https://talkntalk.africa/api/v1/whatsapp/sessions';
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
      const whatsappSessionId = settings.find((s: any) => s.key === 'whatsapp_session_id')?.value as string;

      if (!apiKey || !accountEmail || !senderId || !whatsappSessionId) {
        console.warn('Messaging credentials not fully configured');
        return null;
      }

      return { apiKey, accountEmail, senderId, whatsappSessionId };
    } catch (error) {
      console.error('Error fetching messaging credentials:', error);
      return null;
    }
  }

  /**
   * Format phone number to Kenya format (254XXXXXXXXX)
   * Handles: +254xxx, 0xxx, 254xxx, 7xxx
   */
  formatPhoneNumber(phone: string): string {
    // Remove any whitespace and special characters except +
    let cleaned = phone.replace(/[\s-()]/g, '');
    
    // Remove leading + if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // Handle different formats
    if (cleaned.startsWith('254')) {
      // Already in correct format
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      // Replace leading 0 with 254
      return '254' + cleaned.substring(1);
    } else if (cleaned.length === 9 && cleaned.startsWith('7')) {
      // Add 254 prefix
      return '254' + cleaned;
    }
    
    // Return as-is if format is unclear (will likely fail at API)
    return cleaned;
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
   * Send WhatsApp message
   */
  private async sendWhatsApp(phone: string, message: string, credentials: MessagingCredentials): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const formattedMessage = this.formatMessage(message);

      const url = `${this.WHATSAPP_URL_BASE}/${credentials.whatsappSessionId}/message/send`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': credentials.apiKey,
          'X-Account-Email': credentials.accountEmail,
        },
        body: JSON.stringify({
          recipient: formattedPhone,
          message: formattedMessage,
        }),
      });

      const result = await response.json() as MessageResponse;
      
      if (result.status_code === 200) {
        console.log(`WhatsApp message sent successfully to ${formattedPhone}`);
        return true;
      } else {
        console.error(`WhatsApp send failed: ${result.message}`);
        return false;
      }
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
    
    if (!credentials) {
      console.error('Cannot send message: Messaging credentials not configured');
      return { sms: false, whatsapp: false };
    }

    // Send both messages concurrently
    const [smsResult, whatsappResult] = await Promise.all([
      this.sendSMS(phone, message, credentials),
      this.sendWhatsApp(phone, message, credentials),
    ]);

    return { sms: smsResult, whatsapp: whatsappResult };
  }

  /**
   * Send OTP verification code
   */
  async sendOTP(phone: string, otpCode: string): Promise<{ sms: boolean; whatsapp: boolean }> {
    const message = `Your verification code is ${otpCode}. Valid for 10 minutes.`;
    return this.sendMessage(phone, message);
  }

  /**
   * Send fund receipt notification
   */
  async sendFundReceipt(phone: string, amount: string, currency: string, sender: string): Promise<{ sms: boolean; whatsapp: boolean }> {
    const message = `You received ${currency} ${amount} from ${sender}. Check your account.`;
    return this.sendMessage(phone, message);
  }

  /**
   * Send login alert with location and IP
   */
  async sendLoginAlert(phone: string, location: string, ip: string): Promise<{ sms: boolean; whatsapp: boolean }> {
    const message = `New login from ${location} (IP: ${ip}). Not you? Contact support.`;
    return this.sendMessage(phone, message);
  }

  /**
   * Send KYC verified notification
   */
  async sendKYCVerified(phone: string): Promise<{ sms: boolean; whatsapp: boolean }> {
    const message = `Your account is now verified! You can now access all features.`;
    return this.sendMessage(phone, message);
  }

  /**
   * Send card activation notification
   */
  async sendCardActivation(phone: string, cardLastFour: string): Promise<{ sms: boolean; whatsapp: boolean }> {
    const message = `Your virtual card ending in ${cardLastFour} is now active!`;
    return this.sendMessage(phone, message);
  }

  /**
   * Send transaction notification
   */
  async sendTransactionNotification(phone: string, type: string, amount: string, currency: string, status: string): Promise<{ sms: boolean; whatsapp: boolean }> {
    const action = type === 'withdraw' ? 'Withdrawal' : type === 'send' ? 'Transfer' : 'Transaction';
    const message = `${action} of ${currency} ${amount} ${status}. Check your account for details.`;
    return this.sendMessage(phone, message);
  }

  /**
   * Generate 6-digit OTP code
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export const messagingService = new MessagingService();
