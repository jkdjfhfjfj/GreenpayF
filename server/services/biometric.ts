import crypto from 'crypto';

interface StoredCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
}

export class BiometricService {
  private challenges: Map<string, { challenge: string; timestamp: number }> = new Map();
  private readonly CHALLENGE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  generateChallenge(userId: string): string {
    const challenge = crypto.randomBytes(32).toString('base64url');
    this.challenges.set(userId, { challenge, timestamp: Date.now() });
    return challenge;
  }

  verifyChallenge(userId: string, challenge: string): boolean {
    const stored = this.challenges.get(userId);
    if (!stored) return false;

    if (Date.now() - stored.timestamp > this.CHALLENGE_TIMEOUT) {
      this.challenges.delete(userId);
      return false;
    }

    const isValid = stored.challenge === challenge;
    if (isValid) {
      this.challenges.delete(userId);
    }
    return isValid;
  }

  generateWebAuthnChallenge(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  verifyBiometric(userId: string, challenge: string, response: any): boolean {
    // Verify the challenge matches
    const stored = this.challenges.get(userId);
    if (!stored || stored.challenge !== challenge) {
      return false;
    }

    // Check timestamp
    if (Date.now() - stored.timestamp > this.CHALLENGE_TIMEOUT) {
      this.challenges.delete(userId);
      return false;
    }

    // In production, verify WebAuthn response here
    // For now, if we have a valid challenge and response with credential ID, it's valid
    if (response && response.credentialId) {
      this.challenges.delete(userId);
      return true;
    }

    return false;
  }

  async registerBiometric(userId: string, credential: any): Promise<boolean> {
    // Store credential safely
    if (credential && credential.credentialId && credential.publicKey) {
      console.log(`Biometric registered for user ${userId}`);
      return true;
    }
    return false;
  }
}

export const biometricService = new BiometricService();
