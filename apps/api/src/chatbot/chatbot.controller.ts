import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

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

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  async chat(@Body() chatRequest: ChatRequest) {
    return this.chatbotService.generateResponse(chatRequest);
  }
}
