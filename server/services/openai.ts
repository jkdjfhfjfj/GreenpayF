import { OpenAI } from 'openai';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ DeepSeek API key not configured');
    }
    this.openai = new OpenAI({ 
      apiKey,
      baseURL: 'https://api.deepseek.com'
    });
  }

  async generateResponse(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Unable to generate response';
    } catch (error) {
      console.error('DeepSeek API error:', error);
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
