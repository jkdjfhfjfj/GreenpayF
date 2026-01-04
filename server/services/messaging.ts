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
      
      let apiKey = settings.find((s: any) => s.key === 'api_key')?.value as string;
      let accountEmail = settings.find((s: any) => s.key === 'account_email')?.value as string;
      let senderId = settings.find((s: any) => s.key === 'sender_id')?.value as string;

      // Fallback to environment variables if not in settings
      apiKey = apiKey || process.env.TALKNTALK_API_KEY || '';
      accountEmail = accountEmail || process.env.TALKNTALK_EMAIL || '';
      senderId = senderId || process.env.TALKNTALK_SENDER_ID || '';

      if (!apiKey || !accountEmail || !senderId) {
        console.warn('SMS messaging credentials not fully configured (settings or env)');
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
   * Send SMS notification to admins for new live chat request
   */
  async sendAdminChatNotification(userId: string): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      const userName = user?.fullName || user?.firstName || 'A user';
      const adminPhones = ['+254741855218', '+254794967351'];
      const credentials = await this['getCredentials']();
      
      if (!credentials) {
        console.warn('Admin chat notification skipped: credentials missing');
        return;
      }

      const notification = `[Admin] ${userName} has started a new live chat. Please attend to them.`;
      
      await Promise.all(adminPhones.map(phone => 
        this['sendSMS'](phone, notification, credentials)
          .catch((err: any) => console.error(`Failed to send admin SMS to ${phone}:`, err))
      ));
    } catch (error) {
      console.error('Error sending admin chat notification:', error);
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
   * Send OTP verification code via SMS, WhatsApp (template), and Email (CONCURRENT)
   */
  async sendOTP(phone: string, otpCode: string, email?: string, userName?: string): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const enableSetting = await storage.getSystemSetting("messaging", "enable_otp_messages");
    if (enableSetting?.value === 'false') {
      return { sms: false, whatsapp: false, email: false };
    }

    const { mailtrapService } = await import('./mailtrap');
    const credentials = await this.getCredentials();
    const firstName = userName?.split(' ')[0] || 'User';
    const lastName = userName?.split(' ').slice(1).join(' ') || '';

    // Send all channels concurrently
    const [smsResult, whatsappResult, emailResult] = await Promise.all([
      credentials ? this.sendSMS(phone, `Your verification code is ${otpCode}. Valid for 10 minutes.`, credentials) : (console.log('SMS not sent: credentials missing'), Promise.resolve(false)),
      whatsappService.isConfigured() ? whatsappService.sendOTP(phone, otpCode) : (console.log('WhatsApp not sent: not configured'), Promise.resolve(false)),
      email ? mailtrapService.sendOTP(email, firstName, lastName, otpCode) : (console.log('Email not sent: missing or service down'), Promise.resolve(false))
    ]);
    
    return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
  }

  /**
   * Send password reset code via SMS, WhatsApp (template), and Email (CONCURRENT)
   */
  async sendPasswordReset(phone: string, resetCode: string, email?: string, userName?: string): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const enableSetting = await storage.getSystemSetting("messaging", "enable_password_reset_messages");
    if (enableSetting?.value === 'false') {
      return { sms: false, whatsapp: false, email: false };
    }

    const { mailtrapService } = await import('./mailtrap');
    const credentials = await this.getCredentials();
    const firstName = userName?.split(' ')[0] || 'User';
    const lastName = userName?.split(' ').slice(1).join(' ') || '';

    // Send all channels concurrently
    const [smsResult, whatsappResult, emailResult] = await Promise.all([
      credentials ? this.sendSMS(phone, `Your password reset code is ${resetCode}. Valid for 10 minutes.`, credentials) : Promise.resolve(false),
      whatsappService.isConfigured() ? whatsappService.sendPasswordReset(phone, resetCode) : Promise.resolve(false),
      email ? mailtrapService.sendPasswordReset(email, firstName, lastName, resetCode) : Promise.resolve(false)
    ]);
    
    return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
  }

  /**
   * Send fund receipt notification via SMS, WhatsApp (template), and Email
   */
  async sendFundReceipt(phone: string, amount: string, currency: string, sender: string, email?: string, userName?: string): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const enableSetting = await storage.getSystemSetting("messaging", "enable_fund_receipt_messages");
    if (enableSetting?.value === 'false') {
      return { sms: false, whatsapp: false, email: false };
    }

    const credentials = await this.getCredentials();
    let smsResult = false;
    let whatsappResult = false;
    
    if (credentials) {
      const message = `You received ${currency} ${amount} from ${sender}. Check your account.`;
      smsResult = await this.sendSMS(phone, message, credentials);
    }
    
    if (whatsappService.isConfigured()) {
      whatsappResult = await whatsappService.sendFundReceipt(phone, amount, currency, sender);
    }
    
    let emailResult = false;
    if (email) {
      emailResult = await emailService.sendFundReceipt(email, amount, currency, sender, userName);
    }
    
    return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
  }

  /**
   * Send login alert with location and IP via SMS, WhatsApp (template), and Email
   */
  async sendLoginAlert(phone: string, location: string, ip: string, email?: string, userName?: string): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const enableSetting = await storage.getSystemSetting("messaging", "enable_login_alert_messages");
    if (enableSetting?.value === 'false') {
      return { sms: false, whatsapp: false, email: false };
    }

    const timestamp = new Date().toLocaleString('en-US', { 
      dateStyle: 'long', 
      timeStyle: 'short' 
    });
    
    const credentials = await this.getCredentials();
    let smsResult = false;
    let whatsappResult = false;
    
    // Send SMS if configured
    if (credentials) {
      const message = `New login from ${location} (IP: ${ip}). Not you? Contact support.`;
      smsResult = await this.sendSMS(phone, message, credentials);
    }
    
    // Send WhatsApp via template (use dedicated template method)
    if (whatsappService.isConfigured()) {
      whatsappResult = await whatsappService.sendLoginAlert(phone, location, ip);
    }
    
    // Send via Email if provided
    let emailResult = false;
    if (email) {
      emailResult = await emailService.sendLoginAlert(email, location, ip, timestamp, userName);
    }
    
    return { 
      sms: smsResult, 
      whatsapp: whatsappResult,
      email: emailResult
    };
  }

  /**
   * Send KYC verified notification via SMS, WhatsApp (template), and Email
   */
  async sendKYCVerified(phone: string, email?: string, userName?: string): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const enableSetting = await storage.getSystemSetting("messaging", "enable_kyc_verified_messages");
    if (enableSetting?.value === 'false') {
      return { sms: false, whatsapp: false, email: false };
    }

    const credentials = await this.getCredentials();
    let smsResult = false;
    let whatsappResult = false;
    
    if (credentials) {
      const message = `Your account is now verified! You can now access all features.`;
      smsResult = await this.sendSMS(phone, message, credentials);
    }
    
    if (whatsappService.isConfigured()) {
      whatsappResult = await whatsappService.sendKYCVerified(phone);
    }
    
    // Send via Email if provided
    let emailResult = false;
    if (email && userName) {
      emailResult = await emailService.sendKYCVerified(email, userName);
    }
    
    return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
  }

  /**
   * Old sendKYCVerified method - kept for now, replaced above
   */
  private async sendKYCVerifiedOld(phone: string, email?: string, userName?: string): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
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
   * Send card activation notification via SMS, WhatsApp (template), and Email
   */
  async sendCardActivation(phone: string, cardLastFour: string, email?: string, userName?: string): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const enableSetting = await storage.getSystemSetting("messaging", "enable_card_activation_messages");
    if (enableSetting?.value === 'false') {
      return { sms: false, whatsapp: false, email: false };
    }

    const credentials = await this.getCredentials();
    let smsResult = false;
    let whatsappResult = false;
    
    if (credentials) {
      const message = `Your virtual card ending in ${cardLastFour} is now active!`;
      smsResult = await this.sendSMS(phone, message, credentials);
    }
    
    if (whatsappService.isConfigured()) {
      whatsappResult = await whatsappService.sendCardActivation(phone, cardLastFour);
    }
    
    let emailResult = false;
    if (email) {
      emailResult = await emailService.sendCardActivation(email, cardLastFour, userName);
    }
    
    return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
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
