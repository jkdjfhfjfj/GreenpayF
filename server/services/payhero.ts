import fetch from 'node-fetch';
import { storage } from '../storage';

export interface PayHeroResponse {
  success: boolean;
  status: string;
  reference: string;
  CheckoutRequestID: string;
}

export interface PayHeroCallbackResponse {
  forward_url: string;
  response: {
    Amount: number;
    CheckoutRequestID: string;
    ExternalReference: string;
    MerchantRequestID: string;
    MpesaReceiptNumber: string;
    Phone: string;
    ResultCode: number;
    ResultDesc: string;
    Status: string;
  };
  status: boolean;
}

export class PayHeroService {
  private username?: string;
  private password?: string;
  private channelId?: number;
  private baseUrl = 'https://backend.payhero.co.ke/api/v2';

  constructor() {
    // Initialize from environment variables as fallback
    const username = process.env.PAYHERO_USERNAME;
    const password = process.env.PAYHERO_PASSWORD;
    const channelId = process.env.PAYHERO_CHANNEL_ID;
    
    this.username = username;
    this.password = password;
    this.channelId = channelId ? parseInt(channelId) : 3407; // Default to 3407 if not set
    
    // Load credentials from database on initialization
    this.loadCredentialsFromDatabase();
  }

  /**
   * Load credentials from database settings
   */
  private async loadCredentialsFromDatabase(): Promise<void> {
    try {
      const settings = await storage.getSystemSettingsByCategory('payhero');
      
      const username = settings.find((s: any) => s.key === 'username')?.value;
      const password = settings.find((s: any) => s.key === 'password')?.value;
      const channelId = settings.find((s: any) => s.key === 'channel_id')?.value;

      // Parse values that might have extra quotes from JSON
      if (username) this.username = this.parseValue(username);
      if (password) this.password = this.parseValue(password);
      if (channelId) this.channelId = parseInt(this.parseValue(channelId));

      if (this.hasCredentials()) {
        console.log('PayHero credentials loaded from database:', {
          hasUsername: !!this.username,
          hasPassword: !!this.password,
          channelId: this.channelId
        });
      } else {
        console.warn('PayHero credentials not fully configured - payment processing may not be available');
      }
    } catch (error) {
      console.error('Error loading PayHero credentials from database:', error);
      console.warn('Using environment variable credentials as fallback');
    }
  }

  /**
   * Parse database value that might have extra quotes from JSON
   */
  private parseValue(value: any): string {
    if (!value) return '';
    
    // Convert to string if not already
    let parsed = String(value).trim();
    
    // Remove extra quotes if present (e.g., """3407""" -> 3407)
    while (parsed.startsWith('"') && parsed.endsWith('"')) {
      parsed = parsed.slice(1, -1);
    }
    return parsed;
  }

  private hasCredentials(): boolean {
    return !!(this.username && this.password && this.channelId);
  }

  /**
   * Get credentials (fetches from database if needed)
   */
  async getCredentials(): Promise<{ username?: string; password?: string; channelId?: number }> {
    // Always load from database to ensure we have the latest settings
    // Database settings take priority over environment variables
    await this.loadCredentialsFromDatabase();
    
    return {
      username: this.username,
      password: this.password,
      channelId: this.channelId
    };
  }

  /**
   * Update PayHero settings (for admin configuration)
   */
  updateSettings(channelId?: number, username?: string, password?: string): void {
    if (channelId !== undefined) this.channelId = channelId;
    if (username !== undefined) this.username = username;
    if (password !== undefined) this.password = password;
  }

  /**
   * Get current channel ID
   */
  getChannelId(): number | undefined {
    return this.channelId;
  }

  /**
   * Generate a unique reference for PayHero transactions
   */
  generateReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GPY${timestamp.slice(-8)}${random}`;
  }

  /**
   * Initiate M-Pesa STK Push payment
   */
  async initiateMpesaPayment(
    amount: number,
    phoneNumber: string,
    externalReference: string,
    customerName?: string,
    callbackUrl?: string
  ): Promise<PayHeroResponse> {
    try {
      // Ensure credentials are loaded from database
      await this.getCredentials();
      
      if (!this.hasCredentials()) {
        console.error('PayHero credentials not available');
        return {
          success: false,
          status: 'CREDENTIALS_MISSING',
          reference: '',
          CheckoutRequestID: ''
        };
      }

      const url = `${this.baseUrl}/payments`;
      
      // Format phone number to 07xxx format as required by PayHero (must be exactly 10 digits)
      let cleanPhone = phoneNumber.replace(/\+/g, '').replace(/\s/g, '').replace(/-/g, '');
      
      // Handle different formats
      if (cleanPhone.startsWith('254')) {
        // International format: +254712345678 → 0712345678
        cleanPhone = '0' + cleanPhone.substring(3);
      } else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) {
        // Missing 0 prefix: 712345678 → 0712345678
        cleanPhone = '0' + cleanPhone;
      } else if (!cleanPhone.startsWith('0')) {
        // Invalid format - log error
        console.error('Invalid phone number format for PayHero:', phoneNumber);
        return {
          success: false,
          status: 'INVALID_PHONE_FORMAT',
          reference: '',
          CheckoutRequestID: ''
        };
      }
      
      // Validate: Must be exactly 10 digits starting with 07 or 01
      if (cleanPhone.length !== 10 || !cleanPhone.match(/^0[17]\d{8}$/)) {
        console.error('PayHero phone validation failed:', {
          original: phoneNumber,
          formatted: cleanPhone,
          length: cleanPhone.length,
          expected: '10 digits starting with 07 or 01'
        });
        return {
          success: false,
          status: 'INVALID_PHONE_NUMBER',
          reference: '',
          CheckoutRequestID: ''
        };
      }

      const payload = {
        amount: Math.round(amount), // PayHero expects integer amounts
        phone_number: cleanPhone,
        channel_id: this.channelId,
        provider: 'm-pesa',
        external_reference: externalReference,
        customer_name: customerName,
        callback_url: callbackUrl
      };

      // Create proper Basic Auth header
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      const authHeader = `Basic ${credentials}`;

      console.log('PayHero payment request:', { 
        amount: payload.amount, 
        phone: payload.phone_number, 
        reference: externalReference,
        channel_id: payload.channel_id,
        url: url
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json() as any;
      
      console.log('PayHero HTTP response:', { 
        httpStatus: response.status, 
        success: data.success, 
        status: data.status, 
        reference: data.reference,
        error: data.error || data.message 
      });
      
      // Check for HTTP errors first
      if (!response.ok) {
        console.error('PayHero HTTP error:', response.status, data);
        return {
          success: false,
          status: `HTTP_${response.status}`,
          reference: '',
          CheckoutRequestID: ''
        };
      }
      
      return {
        success: data.success || false,
        status: data.status || 'FAILED',
        reference: data.reference || '',
        CheckoutRequestID: data.CheckoutRequestID || ''
      };
    } catch (error) {
      console.error('PayHero payment initiation error:', error);
      return {
        success: false,
        status: 'ERROR',
        reference: '',
        CheckoutRequestID: ''
      };
    }
  }

  /**
   * Check transaction status using PayHero's transaction-status endpoint
   */
  async checkTransactionStatus(reference: string): Promise<{ success: boolean; status: string; data?: any; message?: string }> {
    try {
      const url = `${this.baseUrl}/transaction-status?reference=${reference}`;
      
      // Create proper Basic Auth header
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      const authHeader = `Basic ${credentials}`;

      console.log('Checking PayHero transaction status:', { reference, url });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      });

      const data = await response.json() as any;
      
      console.log('PayHero transaction status response:', { 
        httpStatus: response.status,
        reference,
        status: data.status,
        success: data.success
      });
      
      if (!response.ok) {
        console.error('PayHero transaction status HTTP error:', response.status, data);
        return {
          success: false,
          status: 'ERROR',
          message: data.message || 'Failed to check transaction status'
        };
      }
      
      return {
        success: true,
        status: data.status || 'UNKNOWN',
        data: data,
        message: data.message
      };
    } catch (error) {
      console.error('PayHero transaction status check error:', error);
      return {
        success: false,
        status: 'ERROR',
        message: 'Failed to check transaction status'
      };
    }
  }

  /**
   * Process PayHero callback response
   */
  processCallback(callbackData: PayHeroCallbackResponse): {
    success: boolean;
    amount: number;
    reference: string;
    mpesaReceiptNumber?: string;
    status: string;
  } {
    const { response } = callbackData;
    
    return {
      success: response.ResultCode === 0 && response.Status === 'Success',
      amount: response.Amount,
      reference: response.ExternalReference,
      mpesaReceiptNumber: response.MpesaReceiptNumber,
      status: response.Status
    };
  }

  /**
   * Convert USD to KES (using a fixed rate for now, could be improved with real-time rates)
   */
  async convertUSDtoKES(usdAmount: number): Promise<number> {
    // Using approximate exchange rate - in production you might want to use a real-time API
    const exchangeRate = 129; // 1 USD = ~129 KES (approximate)
    return Math.round(usdAmount * exchangeRate);
  }
}

// Export singleton instance
export const payHeroService = new PayHeroService();