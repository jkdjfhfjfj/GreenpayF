import fetch from 'node-fetch';
import { storage } from '../storage';

/**
 * WhatsApp Business Meta API Service
 * Sends messages using Meta's WhatsApp Business API (Graph API v18.0)
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/
 */
export class WhatsAppService {
  private accessToken?: string;
  private phoneNumberId?: string;
  private apiVersion = 'v18.0';
  private graphApiUrl = 'https://graph.instagram.com';

  constructor() {
    this.loadCredentials();
  }

  /**
   * Load credentials from environment variables and database
   */
  private async loadCredentials(): Promise<void> {
    try {
      // Try to get from database first (allows admin updates without restart)
      const tokenSetting = await storage.getSystemSetting("messaging", "whatsapp_access_token");
      const phoneSetting = await storage.getSystemSetting("messaging", "whatsapp_phone_number_id");
      
      this.accessToken = tokenSetting?.value || process.env.WHATSAPP_ACCESS_TOKEN;
      this.phoneNumberId = phoneSetting?.value || process.env.WHATSAPP_PHONE_NUMBER_ID;
      
      if (this.accessToken && this.phoneNumberId) {
        console.log('[WhatsApp] ✓ Credentials loaded successfully');
      } else {
        console.warn('[WhatsApp] ⚠️ Credentials not found. Token:', !!this.accessToken, 'Phone ID:', !!this.phoneNumberId);
      }
    } catch (error) {
      console.error('[WhatsApp] Error loading credentials from database:', error);
      // Fallback to env vars
      this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    }
  }

  /**
   * Refresh credentials when settings are updated
   */
  async refreshCredentials(): Promise<void> {
    console.log('[WhatsApp] Refreshing credentials...');
    await this.loadCredentials();
  }

  private checkCredentials(): boolean {
    const hasToken = !!(this.accessToken && this.accessToken.trim());
    const hasPhoneId = !!(this.phoneNumberId && this.phoneNumberId.trim());
    
    if (!hasToken || !hasPhoneId) {
      console.warn('[WhatsApp] Configuration missing:', {
        hasToken,
        hasPhoneId,
        tokenLength: this.accessToken?.length || 0,
        phoneIdLength: this.phoneNumberId?.length || 0
      });
    }
    
    return hasToken && hasPhoneId;
  }

  /**
   * Format phone number to international format (without +)
   * WhatsApp API requires: 1XXXXXXXXXX (no + prefix)
   */
  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[\s-()]/g, '');
    
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2);
    }
    
    return cleaned;
  }

  /**
   * Send text message via WhatsApp Business API
   */
  async sendTextMessage(phoneNumber: string, message: string): Promise<boolean> {
    // Refresh credentials before sending (in case they were just updated)
    await this.refreshCredentials();
    
    if (!this.checkCredentials()) {
      console.error('[WhatsApp] ✗ Credentials not configured or empty. Cannot send message.');
      console.error('[WhatsApp] Debug info:', {
        tokenExists: !!this.accessToken,
        tokenEmpty: this.accessToken === '',
        phoneIdExists: !!this.phoneNumberId,
        phoneIdEmpty: this.phoneNumberId === ''
      });
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json() as any;

      if (response.ok && responseData.messages) {
        console.log(`[WhatsApp] ✓ Text message sent to ${phoneNumber}`);
        return true;
      } else {
        const errorMsg = responseData.error?.message || 'Unknown error';
        console.error(`[WhatsApp] ✗ Message failed: ${errorMsg}`, { status: response.status, data: responseData });
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp] Error sending text message:', error);
      return false;
    }
  }

  /**
   * Send OTP via template message
   * Requires template to be created in WhatsApp Business Manager first
   */
  async sendOTP(phoneNumber: string, otpCode: string): Promise<boolean> {
    // Refresh credentials before sending
    await this.refreshCredentials();
    
    if (!this.checkCredentials()) {
      console.error('[WhatsApp] ✗ Credentials not configured - OTP not sent');
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'otp_verification',
          language: {
            code: 'en',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otpCode,
                },
              ],
            },
          ],
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json() as any;

      if (response.ok && responseData.messages) {
        console.log(`[WhatsApp] ✓ OTP sent to ${phoneNumber}`);
        return true;
      } else {
        const errorMsg = responseData.error?.message || 'Unknown error';
        console.error(`[WhatsApp] ✗ OTP failed: ${errorMsg}`, { status: response.status, data: responseData });
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp] Error sending OTP:', error);
      return false;
    }
  }

  /**
   * Check if WhatsApp is properly configured
   */
  isConfigured(): boolean {
    return this.checkCredentials();
  }

  /**
   * Generate 6-digit OTP code
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export const whatsappService = new WhatsAppService();
