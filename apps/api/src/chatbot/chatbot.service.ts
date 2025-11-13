import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface GeminiMessage {
  role?: string;
  parts: { text: string }[];
}

interface ChatRequest {
  userMessage: string;
  conversationHistory: GeminiMessage[];
  taskContext: string;
  userName: string;
}

@Injectable()
export class ChatbotService {
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async generateResponse(chatRequest: ChatRequest): Promise<{ text: string }> {
    const { userMessage, conversationHistory, taskContext, userName } = chatRequest;
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // System prompt with context
    const systemPrompt = `You are a task management assistant. The user ${userName} is looking at this EXACT list of tasks on their screen RIGHT NOW:

${taskContext}

MANDATORY RULES - YOU MUST FOLLOW THESE:
1. ONLY talk about tasks from the list above - use their exact names
2. Keep response under 50 words
3. Use markdown: **bold** for task names, • for bullets
4. Format: One line + bullets + one action

DO NOT write generic advice. DO NOT say "take a deep breath" or "you're not alone".
ONLY reference the specific tasks listed above by their exact names.

Response structure:
[One sentence about their tasks]
• **"Exact Task Name"** - [why prioritize]
• **"Exact Task Name"** - [why prioritize]
👉 [One clear action]`;


    // Build request messages
    const messages: GeminiMessage[] = [];

    // Add system context if it's a new conversation
    if (conversationHistory.length === 0) {
      messages.push({
        parts: [{ text: systemPrompt }]
      });
      messages.push({
        role: 'model',
        parts: [{ text: "👋 I see your tasks. What do you need?" }]
      });
    } else {
      // For continuing conversations, remind about the rules
      messages.push({
        parts: [{ text: `REMINDER: User ${userName} is viewing these tasks:\n${taskContext}\n\nRULES: Under 50 words, use **bold** for task names, reference exact tasks only.` }]
      });
    }

    // Add conversation history
    messages.push(...conversationHistory);

    // Add current user message with context reminder
    messages.push({
      parts: [{ text: `${userMessage}\n\n[RESPOND USING THE TASKS LISTED ABOVE. USE MARKDOWN. UNDER 50 WORDS.]` }]
    });

    const requestBody = {
      contents: messages,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 200,  // Enforce short responses
      }
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<any>(
          `${this.GEMINI_API_URL}?key=${apiKey}`,
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that. Please try again.";
      return { text };
    } catch (error: any) {
      console.error('Gemini API error:', error.response?.data || error.message);
      throw error;
    }
  }
}
