import { GoogleGenerativeAI } from '@google/generative-ai';

export class OpenAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Google AI API key not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey || '');

    // ✅ gemini-1.5-flash works ONLY on v1
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });
  }

  async generateResponse(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    try {
      const systemPrompt = `
You are a helpful AI assistant for GreenPay, a comprehensive fintech payment application for KES users.

You MUST only answer questions related to GreenPay's features and services:
- Bill payments and money transfers
- Virtual cards and airtime purchases
- Currency exchange services
- Document uploads and KYC verification
- Support and account management
- Performance-based loans
- WhatsApp Business integration
- Two-factor authentication and biometric login
- Admin panel and support ticket system
- Public API services

If asked about unrelated topics, politely redirect the user.
`;

      // ✅ Gemini-compatible conversation format
      const contents = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood.' }],
        },
        ...messages.map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      ];

      const result = await this.model.generateContent({ contents });

      return result.response.text() || 'Unable to generate response';
    } catch (error) {
      console.error('Google AI API error:', error);
      throw error;
    }
  }

  async getAIFeatureSuggestions(context: string): Promise<string> {
    return this.generateResponse([
      { role: 'user', content: context },
    ]);
  }
}

export const openaiService = new OpenAIService();
