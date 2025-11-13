import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { ChatbotService } from '../../services/chatbot.service';
import { Task } from '../../models/task.model';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent {
  @Input() tasks: Task[] = [];
  @Input() userName: string = 'User';
  @Output() close = new EventEmitter<void>();

  messages: ChatMessage[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  isMinimized: boolean = false;

  constructor(
    private chatbotService: ChatbotService,
    private sanitizer: DomSanitizer
  ) {
    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true
    });

    // Welcome message
    this.messages.push({
      role: 'assistant',
      content: "👋 Hi! I've analyzed your current tasks. Ask me anything - like \"What should I work on next?\" or \"Help me prioritize\" or \"I'm feeling overwhelmed\".",
      timestamp: new Date()
    });
  }

  sendMessage(): void {
    if (!this.userInput.trim() || this.isLoading) {
      return;
    }

    const userMessage = this.userInput.trim();
    this.userInput = '';

    // Add user message to chat
    this.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    // Show loading
    this.isLoading = true;

    // Send to API
    this.chatbotService.sendMessage(userMessage, this.tasks, this.userName).subscribe({
      next: (response) => {
        const assistantMessage = response.text || "I'm sorry, I couldn't process that. Please try again.";

        this.messages.push({
          role: 'assistant',
          content: assistantMessage,
          timestamp: new Date()
        });

        // Store in conversation history
        this.chatbotService.addAssistantResponse(assistantMessage);

        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Chatbot error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);

        let errorMessage = "I'm sorry, I encountered an error. ";

        if (error.status === 401 || error.status === 403) {
          errorMessage += "There's an authentication issue with the AI service. Please check the API key configuration.";
        } else if (error.status === 400) {
          errorMessage += "There was an issue with the request format.";
        } else if (error.status === 429) {
          errorMessage += "Rate limit exceeded. Please try again in a moment.";
        } else if (error.status === 503) {
          errorMessage += "The AI model is currently loading. Please wait a moment and try again.";
        } else {
          errorMessage += "Please try again in a moment.";
        }

        this.messages.push({
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
      }
    });

    this.scrollToBottom();
  }

  clearChat(): void {
    this.chatbotService.clearHistory();
    this.messages = [{
      role: 'assistant',
      content: "Chat cleared! How can I help you?",
      timestamp: new Date()
    }];
  }

  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
  }

  closeChat(): void {
    this.close.emit();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  handleKeyPress(event: KeyboardEvent): void {
    // Prevent default form submission on Enter
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.sendMessage();
    }
  }

  renderMarkdown(content: string): SafeHtml {
    const html = marked.parse(content);
    return this.sanitizer.sanitize(1, html) || '';
  }
}
