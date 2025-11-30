import { storage } from '../storage';

export interface ApiKeyData {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  rateLimit: number;
  scope: string[];
}

export class ApiKeyService {
  async generateApiKey(name: string, scope: string[] = ['read', 'write'], rateLimit: number = 1000): Promise<string> {
    const keyId = `gpay_${Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64').substring(0, 32)}`;
    
    try {
      const keyData = {
        id: keyId,
        key: keyId,
        name: name,
        isActive: true,
        createdAt: new Date(),
        scope: scope,
        rateLimit: rateLimit
      };
      
      await storage.createSystemSetting({
        category: 'api_keys',
        key: keyId,
        value: JSON.stringify(keyData)
      });
      
      console.log(`[API Key] ✓ Generated: ${name} (${keyId})`);
      return keyId;
    } catch (error) {
      console.error('[API Key] Error generating key:', error);
      throw error;
    }
  }

  async validateApiKey(key: string, requiredScope: string): Promise<boolean> {
    try {
      if (!key || !key.startsWith('gpay_')) {
        return false;
      }

      const settings = await storage.getSystemSetting('api_keys', key);
      
      if (!settings) {
        console.warn(`[API Key] ✗ Key not found: ${key}`);
        return false;
      }

      const keyData = JSON.parse(typeof settings.value === 'string' ? settings.value : JSON.stringify(settings.value)) as ApiKeyData;

      if (!keyData.isActive) {
        console.warn(`[API Key] ✗ Key is inactive: ${key}`);
        return false;
      }

      if (requiredScope && !keyData.scope?.includes(requiredScope) && !keyData.scope?.includes('*')) {
        console.warn(`[API Key] ✗ Key lacks required scope: ${requiredScope}`);
        return false;
      }

      console.log(`[API Key] ✓ Key validated: ${keyData.name}`);
      return true;
    } catch (error) {
      console.error('[API Key] Error validating:', error);
      return false;
    }
  }

  async revokeApiKey(key: string): Promise<boolean> {
    try {
      const settings = await storage.getSystemSetting('api_keys', key);
      
      if (!settings) {
        console.warn(`[API Key] ✗ Key not found: ${key}`);
        return false;
      }

      const keyData = JSON.parse(typeof settings.value === 'string' ? settings.value : JSON.stringify(settings.value)) as ApiKeyData;
      
      const updatedKeyData = {
        ...keyData,
        isActive: false
      };

      await storage.updateSystemSetting(settings.id, {
        value: JSON.stringify(updatedKeyData)
      });

      console.log(`[API Key] ✓ Revoked: ${key}`);
      return true;
    } catch (error) {
      console.error('[API Key] Error revoking:', error);
      return false;
    }
  }

  async getApiKey(key: string): Promise<ApiKeyData | null> {
    try {
      const settings = await storage.getSystemSetting('api_keys', key);
      
      if (!settings) {
        return null;
      }

      const keyData = JSON.parse(typeof settings.value === 'string' ? settings.value : JSON.stringify(settings.value)) as ApiKeyData;
      return keyData;
    } catch (error) {
      console.error('[API Key] Error retrieving key:', error);
      return null;
    }
  }
}

export const apiKeyService = new ApiKeyService();
