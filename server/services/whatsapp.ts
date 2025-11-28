import fetch from 'node-fetch';

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
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  private checkCredentials(): boolean {
    return !!(this.accessToken && this.phoneNumberId);
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
    if (!this.checkCredentials()) {
      console.warn('WhatsApp credentials not configured - message not sent');
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
        console.log(`✓ WhatsApp text message sent to ${phoneNumber}`);
        return true;
      } else {
        const errorMsg = responseData.error?.message || 'Unknown error';
        console.error(`✗ WhatsApp message failed: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error('WhatsApp text message error:', error);
      return false;
    }
  }

  /**
   * Send OTP via template message
   * Requires template to be created in WhatsApp Business Manager first
   */
  async sendOTP(phoneNumber: string, otpCode: string): Promise<boolean> {
    if (!this.checkCredentials()) {
      console.warn('WhatsApp credentials not configured - OTP not sent');
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
        console.log(`✓ WhatsApp OTP sent to ${phoneNumber}`);
        return true;
      } else {
        const errorMsg = responseData.error?.message || 'Unknown error';
        console.error(`✗ WhatsApp OTP failed: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error('WhatsApp OTP error:', error);
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
