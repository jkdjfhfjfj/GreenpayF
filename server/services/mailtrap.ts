import fetch from 'node-fetch';
import { storage } from '../storage';

interface MailtrapTemplate {
  uuid: string;
  variables: Record<string, string>;
}

const TEMPLATE_UUIDs = {
  otp: '64254a5b-a2ba-4b7d-aa41-5a0907c836db',
  password_reset: '97fe2c00-4cfd-433b-b262-25632cbdbed7',
  welcome: '7711c72e-431b-4fb9-bea9-9738d4d8bfe7',
  kyc_submitted: 'dd087e67-8a7b-4bb8-9645-acbd61666d76',
  kyc_verified: 'c6353bf3-8e12-4852-8607-82223f49a4aa',
  login_alert: '42ce5e3b-eed9-41aa-808c-cfecbd906e60',
  fund_receipt: '5e2a2ec4-37fb-4178-96c4-598977065f9c',
  card_activation: 'placeholder-card-activation', // To be added
  transaction_export: '307e5609-66bb-4235-8653-27f0d5d74a39'
};

export class MailtrapService {
  private apiKey: string | null = null;
  private apiUrl = 'https://send.api.mailtrap.io/api/send';
  private fromEmail = 'support@greenpay.world';
  private fromName = 'GreenPay';
  private initialized = false;

  constructor() {
    // Set default immediately so API key is available
    this.apiKey = process.env.MAILTRAP_API_KEY || '3aac21f265f8750724b1d9bfeff9a712';
    console.log('[Mailtrap] ✓ Service initialized with API key');
    // Load from database asynchronously in background
    this.loadApiKey().catch(err => console.error('[Mailtrap] Background load error:', err));
  }

  /**
   * Load Mailtrap API key from database or environment
   */
  private async loadApiKey(): Promise<void> {
    try {
      // Try to load from database first
      const setting = await storage.getSystemSetting("email", "mailtrap_api_key");
      
      if (setting?.value) {
        this.apiKey = setting.value;
        process.env.MAILTRAP_API_KEY = setting.value;
        console.log('[Mailtrap] ✓ API key loaded from database');
      } else {
        // Fallback to environment variable or default
        this.apiKey = process.env.MAILTRAP_API_KEY || '3aac21f265f8750724b1d9bfeff9a712';
        if (process.env.MAILTRAP_API_KEY) {
          console.log('[Mailtrap] ✓ API key loaded from environment');
        } else {
          console.log('[Mailtrap] ✓ Using default API key');
        }
      }
      this.initialized = true;
    } catch (error) {
      console.error('[Mailtrap] Error loading API key:', error);
      // Use default on error
      this.apiKey = process.env.MAILTRAP_API_KEY || '3aac21f265f8750724b1d9bfeff9a712';
    }
  }

  /**
   * Refresh API key when settings are updated
   */
  async refreshApiKey(): Promise<void> {
    console.log('[Mailtrap] Refreshing API key...');
    await this.loadApiKey();
  }

  /**
   * Send email using Mailtrap template with optional attachments
   */
  async sendTemplate(
    toEmail: string,
    templateUuid: string,
    variables: Record<string, string>,
    attachments?: Array<{ filename: string; content: string; disposition: string }>
  ): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.error('[Mailtrap] ✗ API key not configured');
        return false;
      }

      const payload: any = {
        template_uuid: templateUuid,
        template_variables: variables,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        to: [
          { email: toEmail }
        ]
      };

      if (attachments && attachments.length > 0) {
        payload.attachments = attachments;
      }

      console.log(`[Mailtrap] Sending template ${templateUuid} to ${toEmail}${attachments ? ' with attachments' : ''}`);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Api-Token': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[Mailtrap] ✗ Send failed: ${response.status} - ${error}`);
        return false;
      }

      const result = await response.json() as any;
      console.log(`[Mailtrap] ✓ Full Response:`, JSON.stringify(result, null, 2));
      
      // Check if response has success field or message_id
      if (result.success || result.message_id || result.messages) {
        console.log(`[Mailtrap] ✓ Email sent successfully - Response: ${JSON.stringify(result)}`);
        return true;
      } else {
        console.warn(`[Mailtrap] ⚠️ Unexpected response format:`, result);
        return true; // Still return true as email might be queued
      }
    } catch (error) {
      console.error('[Mailtrap] Error sending email:', error);
      return false;
    }
  }

  /**
   * Send OTP verification email
   */
  async sendOTP(toEmail: string, firstName: string, lastName: string, otp: string): Promise<boolean> {
    return this.sendTemplate(toEmail, TEMPLATE_UUIDs.otp, {
      first_name: firstName,
      last_name: lastName,
      otp: otp
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(toEmail: string, firstName: string, lastName: string, resetCode: string): Promise<boolean> {
    return this.sendTemplate(toEmail, TEMPLATE_UUIDs.password_reset, {
      first_name: firstName,
      last_name: lastName,
      reset_code: resetCode
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcome(toEmail: string, firstName: string, lastName: string): Promise<boolean> {
    return this.sendTemplate(toEmail, TEMPLATE_UUIDs.welcome, {
      first_name: firstName,
      last_name: lastName
    });
  }

  /**
   * Send KYC submitted notification
   */
  async sendKYCSubmitted(toEmail: string, firstName: string, lastName: string): Promise<boolean> {
    return this.sendTemplate(toEmail, TEMPLATE_UUIDs.kyc_submitted, {
      first_name: firstName,
      last_name: lastName
    });
  }

  /**
   * Send KYC verified notification
   */
  async sendKYCVerified(toEmail: string, firstName: string, lastName: string): Promise<boolean> {
    return this.sendTemplate(toEmail, TEMPLATE_UUIDs.kyc_verified, {
      first_name: firstName,
      last_name: lastName
    });
  }

  /**
   * Send login alert email
   */
  async sendLoginAlert(
    toEmail: string,
    firstName: string,
    lastName: string,
    location: string,
    ipAddress: string,
    device: string
  ): Promise<boolean> {
    return this.sendTemplate(toEmail, TEMPLATE_UUIDs.login_alert, {
      first_name: firstName,
      last_name: lastName,
      location: location,
      ip_address: ipAddress,
      device: device
    });
  }

  /**
   * Admin: Send custom template to user
   */
  async sendCustomTemplate(
    toEmail: string,
    templateUuid: string,
    variables: Record<string, string>
  ): Promise<boolean> {
    return this.sendTemplate(toEmail, templateUuid, variables);
  }
}

export const mailtrapService = new MailtrapService();
