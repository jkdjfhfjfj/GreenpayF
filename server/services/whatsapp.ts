import fetch from 'node-fetch';
import { storage } from '../storage';

/**
 * WhatsApp Business Meta API Service
 * Sends messages using Meta's WhatsApp Business API (Graph API v24.0)
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/
 */
export class WhatsAppService {
  private accessToken?: string;
  private phoneNumberId?: string;
  private apiVersion = 'v24.0';
  private graphApiUrl = 'https://graph.facebook.com';

  constructor() {
    this.loadCredentials();
  }

  /**
   * Safely extract string value from database result or env var
   */
  private extractStringValue(value: any): string {
    if (!value) return '';
    
    // If it's already a string, return it trimmed
    if (typeof value === 'string') {
      return value.trim();
    }
    
    // If it's an object with a value property (shouldn't happen but handle it)
    if (typeof value === 'object' && value.value && typeof value.value === 'string') {
      return value.value.trim();
    }
    
    // If it's a number or boolean, convert to string
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value).trim();
    }
    
    // Last resort - convert to JSON string and strip if needed
    const strValue = String(value).trim();
    if (strValue === '[object Object]') {
      console.warn('[WhatsApp] ⚠️ Received [object Object] - value is not serializable:', value);
      return '';
    }
    
    return strValue;
  }

  /**
   * Load credentials from environment variables and database
   */
  private async loadCredentials(): Promise<void> {
    try {
      // Try to get from database first (allows admin updates without restart)
      const tokenSetting = await storage.getSystemSetting("messaging", "whatsapp_access_token");
      const phoneSetting = await storage.getSystemSetting("messaging", "whatsapp_phone_number_id");
      
      // Safely extract string values
      const dbToken = tokenSetting?.value ? this.extractStringValue(tokenSetting.value) : '';
      const dbPhoneId = phoneSetting?.value ? this.extractStringValue(phoneSetting.value) : '';
      
      this.accessToken = dbToken || process.env.WHATSAPP_ACCESS_TOKEN || '';
      this.phoneNumberId = dbPhoneId || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
      
      console.log('[WhatsApp] Credentials load result:', {
        hasTokenFromDb: !!dbToken,
        hasTokenFromEnv: !!process.env.WHATSAPP_ACCESS_TOKEN,
        hasPhoneFromDb: !!dbPhoneId,
        hasPhoneFromEnv: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
        usingToken: this.accessToken.length > 0,
        usingPhone: this.phoneNumberId.length > 0,
        tokenLength: this.accessToken.length,
        phoneIdLength: this.phoneNumberId.length
      });
      
      if (this.accessToken && this.phoneNumberId) {
        console.log('[WhatsApp] ✓ Credentials loaded successfully');
      } else {
        console.warn('[WhatsApp] ⚠️ Credentials incomplete - Token:', !!this.accessToken, 'Phone ID:', !!this.phoneNumberId);
      }
    } catch (error) {
      console.error('[WhatsApp] Error loading credentials from database:', error);
      // Fallback to env vars
      this.accessToken = this.extractStringValue(process.env.WHATSAPP_ACCESS_TOKEN);
      this.phoneNumberId = this.extractStringValue(process.env.WHATSAPP_PHONE_NUMBER_ID);
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
    // Ensure values are strings before calling trim()
    const tokenStr = String(this.accessToken || '');
    const phoneStr = String(this.phoneNumberId || '');
    
    const hasToken = !!(tokenStr && tokenStr.trim());
    const hasPhoneId = !!(phoneStr && phoneStr.trim());
    
    if (!hasToken || !hasPhoneId) {
      console.warn('[WhatsApp] Configuration missing:', {
        hasToken,
        hasPhoneId,
        tokenLength: tokenStr.length,
        phoneIdLength: phoneStr.length,
        tokenType: typeof this.accessToken,
        phoneIdType: typeof this.phoneNumberId
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
   * Send template message via WhatsApp Business API (hello_world template)
   * Template messages have higher delivery rates and are pre-approved by Meta
   */
  async sendTextMessage(phoneNumber: string, message: string): Promise<boolean> {
    // Refresh credentials before sending (in case they were just updated)
    await this.refreshCredentials();
    
    if (!this.checkCredentials()) {
      console.error('[WhatsApp] ✗ Credentials not configured or empty. Cannot send message.');
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      // Use template message (hello_world) instead of text for better delivery
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en_US'
          }
        }
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
        console.log(`[WhatsApp] ✓ Template message sent to ${phoneNumber}`);
        return true;
      } else {
        const errorMsg = responseData.error?.message || 'Unknown error';
        console.error(`[WhatsApp] ✗ Message failed: ${errorMsg}`, { status: response.status, data: responseData });
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp] Error sending template message:', error);
      return false;
    }
  }

  /**
   * Send OTP via template message
   * Uses Meta WhatsApp Business API v24.0
   * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/send-message
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
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'otp',
          language: {
            code: 'en_US',
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
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
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
   * Send account verification code via template message
   */
  async sendAccountVerification(phoneNumber: string, verificationCode: string): Promise<boolean> {
    await this.refreshCredentials();
    
    if (!this.checkCredentials()) {
      console.error('[WhatsApp] ✗ Credentials not configured - verification not sent');
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
          name: 'account_verification',
          language: { code: 'en_US' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: verificationCode }
              ]
            }
          ]
        }
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
        console.log(`[WhatsApp] ✓ Account verification sent to ${phoneNumber}`);
        return true;
      } else {
        const errorMsg = responseData.error?.message || 'Unknown error';
        console.error(`[WhatsApp] ✗ Account verification failed: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp] Error sending account verification:', error);
      return false;
    }
  }

  /**
   * Send login alert via template message
   */
  async sendLoginAlert(phoneNumber: string, location: string, ipAddress: string): Promise<boolean> {
    await this.refreshCredentials();
    
    if (!this.checkCredentials()) {
      console.error('[WhatsApp] ✗ Credentials not configured - login alert not sent');
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
          name: 'login_alert',
          language: { code: 'en_US' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: location },
                { type: 'text', text: ipAddress }
              ]
            }
          ]
        }
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
        console.log(`[WhatsApp] ✓ Login alert sent to ${phoneNumber}`);
        return true;
      } else {
        const errorMsg = responseData.error?.message || 'Unknown error';
        console.error(`[WhatsApp] ✗ Login alert failed: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp] Error sending login alert:', error);
      return false;
    }
  }

  /**
   * Send password reset code via template
   */
  async sendPasswordReset(phoneNumber: string, resetCode: string): Promise<boolean> {
    await this.refreshCredentials();
    if (!this.checkCredentials()) return false;

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'password_reset',
          language: { code: 'en_US' },
          components: [{ type: 'body', parameters: [{ type: 'text', text: resetCode }] }]
        }
      };

      const response = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const responseData = await response.json() as any;

      if (response.ok && responseData.messages) {
        console.log(`[WhatsApp] ✓ Password reset sent to ${phoneNumber}`);
        return true;
      } else {
        console.error(`[WhatsApp] ✗ Password reset failed: ${responseData.error?.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp] Error sending password reset:', error);
      return false;
    }
  }

  /**
   * Send KYC verified notification via template
   */
  async sendKYCVerified(phoneNumber: string): Promise<boolean> {
    await this.refreshCredentials();
    if (!this.checkCredentials()) return false;

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'kyc_verified',
          language: { code: 'en_US' }
        }
      };

      const response = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const responseData = await response.json() as any;

      if (response.ok && responseData.messages) {
        console.log(`[WhatsApp] ✓ KYC verified sent to ${phoneNumber}`);
        return true;
      } else {
        console.error(`[WhatsApp] ✗ KYC verified failed: ${responseData.error?.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp] Error sending KYC verified:', error);
      return false;
    }
  }

  /**
   * Send card activation notification via template
   */
  async sendCardActivation(phoneNumber: string, cardLastFour: string): Promise<boolean> {
    await this.refreshCredentials();
    if (!this.checkCredentials()) return false;

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'card_activation',
          language: { code: 'en_US' },
          components: [{ type: 'body', parameters: [{ type: 'text', text: cardLastFour }] }]
        }
      };

      const response = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const responseData = await response.json() as any;

      if (response.ok && responseData.messages) {
        console.log(`[WhatsApp] ✓ Card activation sent to ${phoneNumber}`);
        return true;
      } else {
        console.error(`[WhatsApp] ✗ Card activation failed: ${responseData.error?.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp] Error sending card activation:', error);
      return false;
    }
  }

  /**
   * Send fund receipt notification via template
   */
  async sendFundReceipt(phoneNumber: string, amount: string, currency: string, sender: string): Promise<boolean> {
    await this.refreshCredentials();
    if (!this.checkCredentials()) return false;

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'fund_receipt',
          language: { code: 'en_US' },
          components: [{ type: 'body', parameters: [{ type: 'text', text: currency }, { type: 'text', text: amount }, { type: 'text', text: sender }] }]
        }
      };

      const response = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const responseData = await response.json() as any;

      if (response.ok && responseData.messages) {
        console.log(`[WhatsApp] ✓ Fund receipt sent to ${phoneNumber}`);
        return true;
      } else {
        console.error(`[WhatsApp] ✗ Fund receipt failed: ${responseData.error?.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp] Error sending fund receipt:', error);
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

  /**
   * Get WhatsApp Business Account ID from database or env
   */
  private async getWabaId(): Promise<string> {
    const wabaIdSetting = await storage.getSystemSetting("messaging", "whatsapp_business_account_id");
    return wabaIdSetting?.value ? String(wabaIdSetting.value).trim() : (process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '');
  }

  /**
   * Create WhatsApp template via Meta API
   * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/message-templates
   */
  async createTemplate(templateName: string, category: string, content: any): Promise<boolean> {
    try {
      if (!this.accessToken) {
        console.error('[WhatsApp] ✗ Cannot create template - access token not configured');
        return false;
      }

      const wabaId = await this.getWabaId();
      if (!wabaId) {
        console.error('[WhatsApp] ✗ WhatsApp Business Account ID not configured');
        return false;
      }

      const url = `${this.graphApiUrl}/${this.apiVersion}/${wabaId}/message_templates`;

      const payload = {
        name: templateName,
        language: 'en_US',
        category: category,
        components: content
      };

      console.log(`[WhatsApp] Creating template "${templateName}"...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json() as any;

      if (response.ok && responseData.id) {
        console.log(`[WhatsApp] ✓ Template "${templateName}" created successfully (ID: ${responseData.id})`);
        return true;
      } else {
        console.error(`[WhatsApp] ✗ Template creation failed: ${responseData.error?.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp] Error creating template:', error);
      return false;
    }
  }

  /**
   * Create all required WhatsApp templates via Meta API
   */
  async createAllTemplates(): Promise<{ success: string[]; failed: string[] }> {
    // Refresh credentials first to ensure we have latest token
    await this.refreshCredentials();
    
    const results = { success: [], failed: [] };

    // OTP template (AUTHENTICATION category for verification codes)
    const otpSuccess = await this.createTemplate('otp', 'AUTHENTICATION', [
      {
        type: 'BODY',
        text: 'Your verification code is {{1}}. Valid for 10 minutes.'
      }
    ]);
    if (otpSuccess) results.success.push('otp');
    else results.failed.push('otp');

    // Password Reset template (AUTHENTICATION category for verification codes)
    const pwdSuccess = await this.createTemplate('password_reset', 'AUTHENTICATION', [
      {
        type: 'BODY',
        text: 'Your password reset code is {{1}}. Valid for 10 minutes.'
      }
    ]);
    if (pwdSuccess) results.success.push('password_reset');
    else results.failed.push('password_reset');

    // KYC Verified template (UTILITY category for notifications)
    const kycSuccess = await this.createTemplate('kyc_verified', 'UTILITY', [
      {
        type: 'BODY',
        text: 'Congratulations! Your account has been verified. You can now enjoy all GreenPay features.'
      }
    ]);
    if (kycSuccess) results.success.push('kyc_verified');
    else results.failed.push('kyc_verified');

    // Card Activation template (UTILITY category for notifications)
    const cardSuccess = await this.createTemplate('card_activation', 'UTILITY', [
      {
        type: 'BODY',
        text: 'Your virtual card ending in {{1}} has been activated and is ready to use.',
        example: {
          body_text: [['4242']]
        }
      }
    ]);
    if (cardSuccess) results.success.push('card_activation');
    else results.failed.push('card_activation');

    // Fund Receipt template (UTILITY category for notifications)
    const fundSuccess = await this.createTemplate('fund_receipt', 'UTILITY', [
      {
        type: 'BODY',
        text: 'You have received {{1}}{{2}} from {{3}}. Your new balance is available in your wallet.',
        example: {
          body_text: [['USD', '100.00', 'John Doe']]
        }
      }
    ]);
    if (fundSuccess) results.success.push('fund_receipt');
    else results.failed.push('fund_receipt');

    // Login Alert template (UTILITY category for notifications)
    const loginSuccess = await this.createTemplate('login_alert', 'UTILITY', [
      {
        type: 'BODY',
        text: 'New login detected on your account from {{1}} ({{2}}). If this wasn\'t you, please secure your account immediately.',
        example: {
          body_text: [['Nairobi, Kenya', '197.89.23.45']]
        }
      }
    ]);
    if (loginSuccess) results.success.push('login_alert');
    else results.failed.push('login_alert');

    return results;
  }

  /**
   * Fetch all templates from Meta Business Account
   */
  async fetchTemplatesFromMeta(): Promise<any[]> {
    try {
      if (!this.accessToken) {
        console.error('[WhatsApp] ✗ Cannot fetch templates - access token not configured');
        return [];
      }

      const wabaId = await this.getWabaId();
      if (!wabaId) {
        console.error('[WhatsApp] ✗ WhatsApp Business Account ID not configured');
        return [];
      }

      const url = `${this.graphApiUrl}/${this.apiVersion}/${wabaId}/message_templates?fields=name,status,language,category`;

      console.log(`[WhatsApp] Fetching templates from Meta...`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const responseData = await response.json() as any;

      if (response.ok && responseData.data) {
        console.log(`[WhatsApp] ✓ Found ${responseData.data.length} templates`);
        return responseData.data;
      } else {
        console.error(`[WhatsApp] ✗ Failed to fetch templates: ${responseData.error?.message || 'Unknown error'}`);
        return [];
      }
    } catch (error) {
      console.error('[WhatsApp] Error fetching templates:', error);
      return [];
    }
  }
}

export const whatsappService = new WhatsAppService();
