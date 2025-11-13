import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';
import { environment } from '../../environments/environment';

interface GeminiMessage {
  role?: 'user' | 'model';
  parts: { text: string }[];
}

interface ChatbotResponse {
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private conversationHistory: GeminiMessage[] = [];

  constructor(private http: HttpClient) {}

  sendMessage(userMessage: string, tasks: Task[], userName: string): Observable<ChatbotResponse> {
    // Build task context
    const taskContext = this.buildTaskContext(tasks);

    // Add current user message to history
    const userMsg: GeminiMessage = {
      parts: [{ text: userMessage }]
    };

    // Prepare request for backend
    const requestBody = {
      userMessage,
      conversationHistory: this.conversationHistory,
      taskContext,
      userName
    };

    // Store user message in history
    this.conversationHistory.push(userMsg);

    // Call backend API (instead of Gemini directly)
    return this.http.post<ChatbotResponse>(`${environment.apiUrl}/chatbot/chat`, requestBody);
  }

  addAssistantResponse(response: string): void {
    this.conversationHistory.push({
      role: 'model',
      parts: [{ text: response }]
    });
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  private buildTaskContext(tasks: Task[]): string {
    if (tasks.length === 0) {
      return 'No tasks currently in the system.';
    }

    const todoTasks = tasks.filter(t => t.status === 'todo');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const doneTasks = tasks.filter(t => t.status === 'done');

    let context = `Total tasks: ${tasks.length}\n`;
    context += `- To Do: ${todoTasks.length}\n`;
    context += `- In Progress: ${inProgressTasks.length}\n`;
    context += `- Done: ${doneTasks.length}\n\n`;

    // Add TO DO tasks
    if (todoTasks.length > 0) {
      context += '📋 TO DO TASKS:\n';
      todoTasks.forEach((task, index) => {
        context += this.formatTask(task, index + 1);
      });
      context += '\n';
    }

    // Add IN PROGRESS tasks
    if (inProgressTasks.length > 0) {
      context += '🔄 IN PROGRESS TASKS:\n';
      inProgressTasks.forEach((task, index) => {
        context += this.formatTask(task, index + 1);
      });
      context += '\n';
    }

    // Add DONE tasks (limit to recent 3)
    if (doneTasks.length > 0) {
      context += '✅ RECENTLY COMPLETED:\n';
      doneTasks.slice(0, 3).forEach((task, index) => {
        context += this.formatTask(task, index + 1);
      });
    }

    return context;
  }

  private formatTask(task: Task, index: number): string {
    let taskStr = `${index}. "${task.title}" [${task.category}]`;

    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const isOverdue = dueDate < today;
      taskStr += ` - Due: ${dueDate.toLocaleDateString()}${isOverdue ? ' (OVERDUE!)' : ''}`;
    }

    if (task.assignedTo) {
      taskStr += ` - Assigned to: ${task.assignedTo.username}`;
    }

    if (task.description) {
      taskStr += ` - "${task.description}"`;
    }

    taskStr += '\n';
    return taskStr;
  }
}
