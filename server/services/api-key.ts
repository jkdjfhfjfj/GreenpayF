import { storage } from '../storage';

export interface ApiKeyData {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  rateLimit: number; // requests per minute
  scope: string[]; // which endpoints this key can access
}

export class ApiKeyService {
  /**
   * Generate a new API key
   */
  async generateApiKey(name: string, scope: string[] = ['read', 'write'], rateLimit: number = 1000): Promise<string> {
    const key = `gpay_${Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64').substring(0, 32)}`;
    
    try {
      await storage.createSystemSetting('api_keys', name, {
        key: key,
        name: name,
        isActive: true,
        createdAt: new Date(),
        scope: scope,
        rateLimit: rateLimit,
        requestsToday: 0
      });
      
      console.log(`[API Key] ✓ Generated new API key: ${name}`);
      return key;
    } catch (error) {
      console.error('[API Key] Error generating key:', error);
      throw error;
    }
  }

  /**
   * Validate API key and check scope
   */
  async validateApiKey(key: string, requiredScope: string): Promise<boolean> {
    try {
      if (!key || !key.startsWith('gpay_')) {
        console.warn('[API Key] ✗ Invalid key format');
        return false;
      }

      // Search through system settings for API keys
      const settings = await storage.getSystemSetting('api_keys', key);
      
      if (!settings) {
        console.warn(`[API Key] ✗ Key not found: ${key}`);
        return false;
      }

      const keyData = settings.value as any;

      // Check if key is active
      if (!keyData.isActive) {
        console.warn(`[API Key] ✗ Key is inactive: ${key}`);
        return false;
      }

      // Check scope
      if (requiredScope && !keyData.scope?.includes(requiredScope) && !keyData.scope?.includes('*')) {
        console.warn(`[API Key] ✗ Key lacks required scope: ${requiredScope}`);
        return false;
      }

      // Update last used timestamp
      await storage.updateSystemSetting('api_keys', key, {
        ...keyData,
        lastUsedAt: new Date()
      });

      console.log(`[API Key] ✓ Key validated: ${keyData.name}`);
      return true;
    } catch (error) {
      console.error('[API Key] Error validating key:', error);
      return false;
    }
  }

  /**
   * Revoke/deactivate an API key
   */
  async revokeApiKey(key: string): Promise<boolean> {
    try {
      const settings = await storage.getSystemSetting('api_keys', key);
      
      if (!settings) {
        console.warn(`[API Key] ✗ Key not found: ${key}`);
        return false;
      }

      const keyData = settings.value as any;
      await storage.updateSystemSetting('api_keys', key, {
        ...keyData,
        isActive: false
      });

      console.log(`[API Key] ✓ Key revoked: ${key}`);
      return true;
    } catch (error) {
      console.error('[API Key] Error revoking key:', error);
      return false;
    }
  }
}

export const apiKeyService = new ApiKeyService();
