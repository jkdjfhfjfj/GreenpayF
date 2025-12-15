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
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateResponse(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): Promise<string> {
    try {
      const systemPrompt = `You are a helpful AI assistant for GreenPay, a comprehensive fintech payment application for KES users.

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

IMPORTANT RULES:
1. Only respond to questions about GreenPay features and services
2. If asked about unrelated topics, politely redirect the user by saying: "I'm here to help with GreenPay features. Could you ask me something about bill payments, transfers, virtual cards, airtime, currency exchange, loans, or your account?"
3. Provide helpful, concise, and professional responses
4. Be friendly and supportive in your tone`;

      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Add system prompt as the first message
      const contents = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I will only provide assistance related to GreenPay features and services.' }]
        },
        ...conversationHistory
      ];

      const result = await this.model.generateContent({
        contents
      });

      return result.response.text() || 'Unable to generate response';
    } catch (error) {
      console.error('Google AI API error:', error);
      throw error;
    }
  }

  async getAIFeatureSuggestions(context: string): Promise<string> {
    const systemPrompt = `You are a helpful AI assistant for GreenPay, a fintech payment application. 
Provide helpful, concise suggestions and answers about:
- Bill payments and money transfers
- Virtual cards and airtime purchases
- Currency exchange services
- Document uploads and KYC verification
- Support and account management
- Performance-based loans

Keep responses brief and professional.`;

    return this.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: context }
    ]);
  }
}

export const openaiService = new OpenAIService();
