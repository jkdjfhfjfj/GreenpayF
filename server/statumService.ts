import fetch from 'node-fetch';

interface StatumAirtimeRequest {
  phone_number: string;
  amount: number;
}

interface StatumAirtimeResponse {
  success: boolean;
  message: string;
  transaction_id?: string;
  balance?: number;
  [key: string]: any;
}

export class StatumService {
  private consumerKey: string;
  private consumerSecret: string;
  private apiUrl: string;

  constructor() {
    this.consumerKey = process.env.STATUM_CONSUMER_KEY || '';
    this.consumerSecret = process.env.STATUM_CONSUMER_SECRET || '';
    this.apiUrl = 'https://api.statum.co.ke/api/v2/airtime';
    
    if (this.isConfigured()) {
      console.log('✅ Statum Service initialized and configured');
    } else {
      console.warn('⚠️ Statum Service initialized but NOT configured - credentials missing');
    }
  }

  /**
   * Generate Basic Auth header
   */
  private getAuthHeader(): string {
    const credentials = `${this.consumerKey}:${this.consumerSecret}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');
    return `Basic ${base64Credentials}`;
  }

  /**
   * Format phone number to 254 format (remove leading 0, add 254)
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // If doesn't start with 254, add it
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    console.log(`📞 Formatted phone number: ${phone} -> ${cleaned}`);
    return cleaned;
  }

  /**
   * Purchase airtime via Statum API
   */
  async purchaseAirtime(phoneNumber: string, amount: number): Promise<StatumAirtimeResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      console.log(`📱 Statum API Request: Purchasing KES ${amount} airtime for ${formattedPhone}`);
      console.log(`🔗 Endpoint: ${this.apiUrl}`);
      
      const requestBody: StatumAirtimeRequest = {
        phone_number: formattedPhone,
        amount: amount,
      };

      console.log(`📤 Request body:`, JSON.stringify(requestBody, null, 2));

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📥 Statum API Response Status: ${response.status} ${response.statusText}`);

      const responseData = await response.json() as StatumAirtimeResponse;
      console.log(`📥 Response data:`, JSON.stringify(responseData, null, 2));

      if (!response.ok) {
        console.error(`❌ Statum API Error: ${response.status}`, responseData);
        throw new Error(responseData.message || `Statum API request failed with status ${response.status}`);
      }

      console.log(`✅ Airtime purchase successful for ${formattedPhone}`);
      return responseData;

    } catch (error) {
      console.error('❌ Statum API Error:', error);
      if (error instanceof Error) {
        throw new Error(`Airtime purchase failed: ${error.message}`);
      }
      throw new Error('Airtime purchase failed: Unknown error');
    }
  }

  /**
   * Check if Statum credentials are configured
   */
  isConfigured(): boolean {
    const configured = !!(this.consumerKey && this.consumerSecret);
    if (!configured) {
      console.warn('⚠️ Statum credentials not configured - airtime purchases will fail');
    }
    return configured;
  }
}

export const statumService = new StatumService();
