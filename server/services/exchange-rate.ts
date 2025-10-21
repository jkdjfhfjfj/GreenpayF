import fetch from 'node-fetch';
import { type IStorage } from '../storage';

export interface ExchangeRate {
  base: string;
  target: string;
  rate: number;
  timestamp: Date;
}

export class ExchangeRateService {
  private apiKey?: string;
  private baseUrl = 'https://v6.exchangerate-api.com/v6';
  private storage?: IStorage;

  constructor(storage?: IStorage) {
    this.storage = storage;
    this.apiKey = process.env.EXCHANGERATE_API_KEY;
    if (!this.apiKey) {
      console.warn('Exchange rate API key not configured - using fallback rates');
    }
  }

  private async getApiKey(): Promise<string | undefined> {
    // First try to get from database if storage is available
    if (this.storage) {
      try {
        const config = await this.storage.getApiConfiguration('exchange_rate');
        if (config && config.isEnabled && config.apiKey) {
          return config.apiKey;
        }
      } catch (error) {
        console.error('Error fetching exchange rate config from database:', error);
      }
    }
    
    // Fall back to environment variable
    return this.apiKey;
  }

  private async hasApiKey(): Promise<boolean> {
    const key = await this.getApiKey();
    return !!key;
  }

  async getExchangeRate(from: string, to: string): Promise<number> {
    // Get API key from database or environment
    const apiKey = await this.getApiKey();
    
    // Use fallback rates if no API key is configured
    if (!apiKey) {
      return this.getFallbackRate(from, to);
    }
    
    try {
      const url = `${this.baseUrl}/${apiKey}/pair/${from}/${to}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as any;
      
      if (data.result !== 'success') {
        throw new Error(`API error: ${data['error-type']}`);
      }
      
      return data.conversion_rate;
    } catch (error) {
      console.error('Exchange rate fetch error:', error);
      return this.getFallbackRate(from, to);
    }
  }

  private getFallbackRate(from: string, to: string): number {
    // Fallback rates for USD/KES only
    const fallbackRates: Record<string, Record<string, number>> = {
      'USD': {
        'KES': 129
      },
      'KES': {
        'USD': 0.0077
      }
    };
    
    return fallbackRates[from]?.[to] || 1;
  }

  async getMultipleRates(base: string, targets: string[]): Promise<Record<string, number>> {
    // Get API key from database or environment
    const apiKey = await this.getApiKey();
    
    // Use fallback rates if no API key is configured
    if (!apiKey) {
      return this.getMultipleFallbackRates(base, targets);
    }
    
    try {
      const url = `${this.baseUrl}/${apiKey}/latest/${base}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as any;
      
      if (data.result !== 'success') {
        throw new Error(`API error: ${data['error-type']}`);
      }
      
      const rates: Record<string, number> = {};
      targets.forEach(target => {
        rates[target] = data.conversion_rates[target] || 1;
      });
      
      return rates;
    } catch (error) {
      console.error('Multiple exchange rates fetch error:', error);
      return this.getMultipleFallbackRates(base, targets);
    }
  }

  private getMultipleFallbackRates(base: string, targets: string[]): Record<string, number> {
    // Return fallback rates for USD/KES only
    const fallbackRates: Record<string, number> = {
      'KES': 129,
      'USD': 0.0077
    };
    
    return Object.fromEntries(
      targets.map(target => [target, fallbackRates[target] || 1])
    );
  }
}

// Export a factory function instead of a singleton to allow passing storage
export const createExchangeRateService = (storage?: IStorage) => new ExchangeRateService(storage);

// Export default instance for backward compatibility
export const exchangeRateService = new ExchangeRateService();