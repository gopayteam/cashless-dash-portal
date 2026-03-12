import { Injectable, signal } from '@angular/core';
import { DataService } from '../api/data.service';
import { AuthService } from './auth.service';
import { AI_ENDPOINTS } from '../api/endpoints/AI_ENDPOINTS';
import { ChatMessage, ChatRequest, ChatResponse } from '../models/ai/ai.models';

@Injectable({ providedIn: 'root' })
export class ChatService {

  entityId: string | null = null;
  sessionId: string | null = null;

  messages = signal<ChatMessage[]>([]);
  isTyping = signal(false);

  readonly welcomeMessage: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content: "Hello! I'm your GoPay assistant.",
    timestamp: new Date(),
    status: 'delivered',
  };

  constructor(
    private dataService: DataService,
    private authService: AuthService
  ) {
    const user = this.authService.currentUser();
    if (user) this.entityId = user.entityId;

    this.messages.set([this.welcomeMessage]);
  }

  sendMessage(text: string, useRag = false) {

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      status: 'sending',
    };

    this.messages.update(m => [...m, userMsg]);
    this.isTyping.set(true);

    const payload: ChatRequest = {
      entityId: this.entityId!,
      sessionId: this.sessionId ?? undefined,
      text,
      useRag
    };

    return this.dataService
      .post<ChatResponse>(AI_ENDPOINTS.CHAT_SEND, payload, 'chatbot', true, true)
      .subscribe(res => {

        this.sessionId = res.data.conversation_id;

        this.messages.update(msgs =>
          msgs.map(m =>
            m.id === userMsg.id ? { ...m, status: 'delivered' } : m
          )
        );

        const assistant: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: res.data.response,
          timestamp: new Date(),
          status: 'delivered',
          sources: res.data.sources,
          intentDetected: res.data.intent,
          confidence: res.data.confidence,
        };

        this.messages.update(m => [...m, assistant]);
        this.isTyping.set(false);
      });
  }

  clear() {
    this.messages.set([this.welcomeMessage]);
    this.sessionId = null;
  }
}
