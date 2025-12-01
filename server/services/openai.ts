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
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const result = await this.model.generateContent({
        contents: conversationHistory
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
