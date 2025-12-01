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
   * Send text message via WhatsApp Business API
   * Sends custom text messages to users
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

      // Send custom text message (not template)
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      };

      console.log('[WhatsApp] Sending text message to', formattedPhone, ':', message);

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
        const messageId = responseData.messages?.[0]?.id || 'unknown';
        console.log('[WhatsApp] ✓ Text message sent successfully', {
          to: phoneNumber,
          messageId,
          messageLength: message.length,
          timestamp: new Date().toISOString(),
          response: responseData
        });
        return true;
      } else {
        const errorMsg = responseData.error?.message || 'Unknown error';
        const errorCode = responseData.error?.code || 'UNKNOWN_ERROR';
        console.error('[WhatsApp] ✗ Text message failed', {
          to: phoneNumber,
          error: errorMsg,
          errorCode,
          status: response.status,
          fullError: responseData.error,
          timestamp: new Date().toISOString()
        });
        return false;
      }
    } catch (error: any) {
      console.error('[WhatsApp] ✗ Error sending text message', {
        to: phoneNumber,
        error: error?.message || 'Unknown error',
        errorType: error?.constructor?.name,
        timestamp: new Date().toISOString()
      });
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
        const messageId = responseData.messages?.[0]?.id || 'unknown';
        console.log('[WhatsApp] ✓ OTP sent successfully', {
          to: phoneNumber,
          messageId,
          templateName: 'otp',
          timestamp: new Date().toISOString(),
          response: responseData
        });
        return true;
      } else {
        const errorMsg = responseData.error?.message || 'Unknown error';
        const errorCode = responseData.error?.code || 'UNKNOWN_ERROR';
        console.error('[WhatsApp] ✗ OTP send failed', {
          to: phoneNumber,
          templateName: 'otp',
          error: errorMsg,
          errorCode,
          status: response.status,
          fullError: responseData.error,
          timestamp: new Date().toISOString()
        });
        return false;
      }
    } catch (error: any) {
      console.error('[WhatsApp] ✗ Error sending OTP', {
        to: phoneNumber,
        error: error?.message || 'Unknown error',
        errorType: error?.constructor?.name,
        timestamp: new Date().toISOString()
      });
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
        const messageId = responseData.messages?.[0]?.id || 'unknown';
        console.log('[WhatsApp] ✓ Account verification sent successfully', {
          to: phoneNumber,
          messageId,
          templateName: 'account_verification',
          timestamp: new Date().toISOString(),
          response: responseData
        });
        return true;
      } else {
        const errorMsg = responseData.error?.message || 'Unknown error';
        console.error('[WhatsApp] ✗ Account verification failed', {
          to: phoneNumber,
          error: errorMsg,
          status: response.status,
          fullError: responseData.error,
          timestamp: new Date().toISOString()
        });
        return false;
      }
    } catch (error: any) {
      console.error('[WhatsApp] ✗ Error sending account verification', {
        to: phoneNumber,
        error: error?.message || 'Unknown error',
        errorType: error?.constructor?.name,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  /**
   * Send login alert via template message
   * Template name is configurable via system settings for flexibility
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

      // Get template name from settings or use defaults - try alternatives if first fails
      const templateNameSetting = await storage.getSystemSetting("whatsapp", "login_alert_template");
      const templateName = (templateNameSetting?.value as string)?.trim() || 'login_alert';

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
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

      console.log('[WhatsApp] Sending login alert', {
        to: phoneNumber,
        templateName,
        location,
        ipAddress
      });

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
        const messageId = responseData.messages?.[0]?.id || 'unknown';
        console.log('[WhatsApp] ✓ Login alert sent successfully', {
          to: phoneNumber,
          messageId,
          templateName,
          timestamp: new Date().toISOString(),
          response: responseData
        });
        return true;
      } else {
        const errorMsg = responseData.error?.message || 'Unknown error';
        const errorCode = responseData.error?.code || 'UNKNOWN_ERROR';
        console.error('[WhatsApp] ✗ Login alert failed', {
          to: phoneNumber,
          templateName,
          error: errorMsg,
          errorCode,
          status: response.status,
          fullError: responseData.error,
          location,
          ipAddress,
          timestamp: new Date().toISOString(),
          suggestion: 'Check if template name matches your WhatsApp Business Account. Update via admin dashboard: Settings > Messaging Settings > WhatsApp Template Names'
        });
        return false;
      }
    } catch (error: any) {
      console.error('[WhatsApp] ✗ Error sending login alert', {
        to: phoneNumber,
        error: error?.message || 'Unknown error',
        errorType: error?.constructor?.name,
        timestamp: new Date().toISOString()
      });
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
   * Send account creation welcome notification via template
   */
  async sendAccountCreation(phoneNumber: string, userName: string): Promise<boolean> {
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
          name: 'create_acc',
          language: { code: 'en' },
          components: [{ type: 'body', parameters: [{ type: 'text', text: userName }] }]
        }
      };

      const response = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const responseData = await response.json() as any;

      if (response.ok && responseData.messages) {
        console.log(`[WhatsApp] ✓ Account creation notification sent to ${phoneNumber}`);
        return true;
      } else {
        console.error(`[WhatsApp] ✗ Account creation notification failed: ${responseData.error?.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp] Error sending account creation notification:', error);
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
   * Validate parameters against template requirements
   */
  async validateTemplateParameters(templateName: string, parameters: Record<string, string>): Promise<{ valid: boolean; error?: string; required: number; provided: number }> {
    try {
      const template = await this.getTemplateDetails(templateName);
      if (!template) {
        return { valid: false, error: `Template "${templateName}" not found in Meta`, required: 0, provided: 0 };
      }

      // Extract required parameter count from template components
      const paramNumbers = this.extractParametersFromComponents(template.components || []);
      const requiredCount = paramNumbers.size;
      const providedCount = Object.values(parameters).filter(p => p && p.trim() !== '').length;

      if (requiredCount > 0 && providedCount < requiredCount) {
        return { 
          valid: false, 
          error: `Template requires ${requiredCount} parameters but only ${providedCount} provided`,
          required: requiredCount,
          provided: providedCount
        };
      }

      return { valid: true, required: requiredCount, provided: providedCount };
    } catch (error) {
      console.error('[WhatsApp] Error validating template parameters:', error);
      return { valid: false, error: 'Failed to validate template', required: 0, provided: 0 };
    }
  }

  /**
   * Send generic template with dynamic parameters and validation
   */
  async sendTemplateGeneric(phoneNumber: string, templateName: string, parameters: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    await this.refreshCredentials();
    if (!this.checkCredentials()) return { success: false, error: 'WhatsApp credentials not configured' };

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      // Get template to get the correct language code
      const template = await this.getTemplateDetails(templateName);
      const languageCode = template?.language || 'en_US';

      // Check for templates that Meta doesn't allow
      const restrictedTemplates = ['call']; // Business-initiated calling not available for all accounts
      if (restrictedTemplates.includes(templateName)) {
        const error = `This template (${templateName}) is not available for sending. Contact Meta support to enable this feature.`;
        console.warn(`[WhatsApp] ✗ Template "${templateName}" is restricted:`, error);
        return { success: false, error };
      }

      // Validate parameters first
      const validation = await this.validateTemplateParameters(templateName, parameters);
      if (!validation.valid) {
        console.warn(`[WhatsApp] Parameter validation failed for "${templateName}":`, validation.error);
        return { success: false, error: validation.error };
      }

      // Build parameters array - keep order from the user's input
      // Only include parameters that were explicitly provided and are non-empty
      const paramArray = Object.values(parameters).filter(p => p && typeof p === 'string' && p.trim() !== '');

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components: paramArray.length > 0 ? [
            {
              type: 'body',
              parameters: paramArray.map(p => ({ type: 'text', text: String(p).trim() }))
            }
          ] : undefined
        }
      };

      // Remove undefined components
      if (!payload.template.components) {
        delete payload.template.components;
      }

      console.log(`[WhatsApp] Sending generic template "${templateName}"`, {
        language: languageCode,
        paramCount: paramArray.length,
        requiredParams: validation.required,
        parameters: paramArray
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json() as any;

      // Meta returns success ONLY if messages array exists AND no error
      if (response.ok && responseData.messages && !responseData.error) {
        console.log(`[WhatsApp] ✓ Generic template "${templateName}" DELIVERED successfully`, {
          messageId: responseData.messages[0]?.id,
          language: languageCode,
          status: 'queued'
        });
        return { success: true };
      } else {
        // ANY error from Meta means failure - don't report success
        const errorMsg = responseData.error?.message || responseData.error?.type || 'Template delivery failed by Meta';
        const errorCode = responseData.error?.code || responseData.error?.error_data?.messaging_product?.details?.error_code;
        console.error(`[WhatsApp] ✗ Generic template FAILED to deliver:`, {
          templateName,
          error: errorMsg,
          errorCode: errorCode,
          language: languageCode,
          sentParams: paramArray.length,
          statusCode: response.status
        });
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = String(error);
      console.error(`[WhatsApp] Error sending generic template "${templateName}":`, error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Create all required WhatsApp templates via Meta API - Compliant with Meta's API requirements
   */
  async createAllTemplates(): Promise<{ success: string[]; failed: string[] }> {
    // Refresh credentials first to ensure we have latest token
    await this.refreshCredentials();
    
    const results = { success: [], failed: [] };

    // 1. Account Creation template - MARKETING with welcome message and CTA
    const createAccSuccess = await this.createTemplate('create_acc', 'MARKETING', [
      {
        type: 'BODY',
        text: 'Welcome to GreenPay, {{1}}!\n\nYour account is ready. Click below to start enjoying seamless payments, virtual cards, and money transfers.'
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Get Started',
            url: 'https://app.greenpay.world/dashboard'
          }
        ]
      }
    ]);
    if (createAccSuccess) results.success.push('create_acc');
    else results.failed.push('create_acc');

    // 2. Login Alert template - UTILITY with security notification and action
    const loginSuccess = await this.createTemplate('login_alert', 'UTILITY', [
      {
        type: 'BODY',
        text: 'New login on your GreenPay account\n\nLocation: {{1}}\nIP: {{2}}\n\nIf this wasn\'t you, secure your account now.'
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Secure Now',
            url: 'https://app.greenpay.world/security'
          }
        ]
      }
    ]);
    if (loginSuccess) results.success.push('login_alert');
    else results.failed.push('login_alert');

    // 3. Fund Receipt template - UTILITY with transaction details
    const fundSuccess = await this.createTemplate('fund_receipt', 'UTILITY', [
      {
        type: 'BODY',
        text: 'You received {{1}} {{2}} from {{3}}\n\nRef: {{4}}\n\nView your wallet for details.'
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'View Wallet',
            url: 'https://app.greenpay.world/wallet'
          }
        ]
      }
    ]);
    if (fundSuccess) results.success.push('fund_receipt');
    else results.failed.push('fund_receipt');

    // 4. Card Activation template - UTILITY with card ready notification
    const cardSuccess = await this.createTemplate('card_activation', 'UTILITY', [
      {
        type: 'BODY',
        text: 'Your GreenPay card {{1}} is now active!\n\nReady for online purchases, bill payments, and transfers.'
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'View Card',
            url: 'https://app.greenpay.world/cards'
          }
        ]
      }
    ]);
    if (cardSuccess) results.success.push('card_activation');
    else results.failed.push('card_activation');

    // 5. KYC Verified template - MARKETING with verification confirmation
    const kycSuccess = await this.createTemplate('kyc_verified', 'MARKETING', [
      {
        type: 'BODY',
        text: 'Great {{1}}! Your identity is verified.\n\nUnlock higher limits, virtual cards, and premium features.'
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Explore Features',
            url: 'https://app.greenpay.world/dashboard'
          }
        ]
      }
    ]);
    if (kycSuccess) results.success.push('kyc_verified');
    else results.failed.push('kyc_verified');

    // 6. Password Reset template - AUTHENTICATION
    const pwdSuccess = await this.createTemplate('password_reset', 'AUTHENTICATION', [
      {
        type: 'BODY',
        text: 'Your password reset code: {{1}}\n\nValid for 10 minutes. Do not share.'
      }
    ]);
    if (pwdSuccess) results.success.push('password_reset');
    else results.failed.push('password_reset');

    return results;
  }

  /**
   * Extract parameters from template components - scans ALL fields for {{1}}, {{2}}, etc
   * Returns SET of unique parameter numbers found
   */
  private extractParametersFromComponents(components: any[]): Set<number> {
    if (!components || !Array.isArray(components)) return new Set();
    
    const paramNumbers = new Set<number>();
    const regex = /\{\{(\d+)\}\}/g;
    
    components.forEach((comp: any) => {
      // Check text field
      if (comp.text && typeof comp.text === 'string') {
        const matches = [...comp.text.matchAll(regex)];
        matches.forEach(m => {
          paramNumbers.add(parseInt(m[1]));
        });
      }
      
      // Check buttons for URL parameters
      if (comp.buttons && Array.isArray(comp.buttons)) {
        comp.buttons.forEach((btn: any) => {
          if (btn.url && typeof btn.url === 'string') {
            const matches = [...btn.url.matchAll(regex)];
            matches.forEach(m => {
              paramNumbers.add(parseInt(m[1]));
            });
          }
        });
      }
      
      // Check header for parameters
      if (comp.format === 'TEXT' && comp.text) {
        const matches = [...comp.text.matchAll(regex)];
        matches.forEach(m => {
          paramNumbers.add(parseInt(m[1]));
        });
      }
    });
    
    return paramNumbers;
  }

  /**
   * Extract parameters from template components - returns param names like param1, param2
   */
  private getComponentParameters(components: any[]): string[] {
    const paramNumbers = this.extractParametersFromComponents(components);
    // Sort by number and create param names
    return Array.from(paramNumbers)
      .sort((a, b) => a - b)
      .map(n => `param${n}`);
  }

  /**
   * Extract parameters from template text (finds {{1}}, {{2}}, etc)
   */
  private extractTemplateParameters(templateText: string): string[] {
    const regex = /\{\{(\d+)\}\}/g;
    const matches = [...templateText.matchAll(regex)];
    const paramNumbers = new Set(matches.map(m => parseInt(m[1])));
    return Array.from(paramNumbers)
      .sort((a, b) => a - b)
      .map(n => `param${n}`);
  }

  /**
   * Get full template details from Meta with components
   */
  async getTemplateDetails(templateName: string): Promise<any> {
    try {
      const templates = await this.fetchTemplatesFromMeta();
      const template = templates.find((t: any) => t.name === templateName);
      return template || null;
    } catch (error) {
      console.error('[WhatsApp] Error getting template details:', error);
      return null;
    }
  }

  /**
   * Get template parameters from Meta - scans full component structure
   */
  async getTemplateParameters(templateName: string): Promise<{ required: string[]; paramCount: number; language: string; components: any[] }> {
    try {
      const template = await this.getTemplateDetails(templateName);
      
      if (!template) {
        return { required: [], paramCount: 0, language: 'en_US', components: [] };
      }

      // Extract parameters from all component types including buttons
      const params = this.getComponentParameters(template.components || []);
      
      console.log(`[WhatsApp] Template "${templateName}" parameters extracted:`, {
        params,
        paramCount: params.length,
        componentCount: template.components?.length || 0
      });

      return { required: params, paramCount: params.length, language: template.language || 'en_US', components: template.components || [] };
    } catch (error) {
      console.error('[WhatsApp] Error getting template parameters:', error);
      return { required: [], paramCount: 0, language: 'en_US', components: [] };
    }
  }

  /**
   * Fetch all templates from Meta Business Account with full component structure
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

      // Fetch with full component structure to extract parameters properly
      const url = `${this.graphApiUrl}/${this.apiVersion}/${wabaId}/message_templates?fields=name,status,language,category,components`;

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
        const templateList = responseData.data.map((t: any) => ({
          name: t.name,
          status: t.status,
          language: t.language,
          category: t.category,
          components: t.components || []
        }));
        console.log('[WhatsApp] ✓ Successfully fetched approved templates from Meta', {
          count: responseData.data.length,
          templates: templateList.map((t: any) => ({ name: t.name, status: t.status, language: t.language })),
          timestamp: new Date().toISOString()
        });
        return responseData.data;
      } else {
        const errorMsg = responseData.error?.message || 'Unknown error';
        console.error('[WhatsApp] ✗ Failed to fetch templates from Meta', {
          error: errorMsg,
          code: responseData.error?.code,
          status: response.status,
          timestamp: new Date().toISOString(),
          suggestion: 'Ensure your WhatsApp Business Account ID (WABA ID) and access token are correctly configured'
        });
        return [];
      }
    } catch (error) {
      console.error('[WhatsApp] Error fetching templates:', error);
      return [];
    }
  }
}

export const whatsappService = new WhatsAppService();
