// pages/chatbot/chatbot.component.ts
import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  AfterViewChecked, ChangeDetectorRef, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { DataService } from '../../../../@core/api/data.service';
import { AuthService } from '../../../../@core/services/auth.service';
import { ChatMessage, ChatRequest, ChatResponse, MessageRole } from '../../../../@core/models/ai/ai.models';
import { AI_ENDPOINTS } from '../../../../@core/models/ai/ai.endpoints';


@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule,
    InputTextModule, TooltipModule, ToastModule, BadgeModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css', '../../../../styles/global/_toast.css'],
  providers: [MessageService],
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  entityId: string | null = null;
  sessionId: string | null = null;

  messages = signal<ChatMessage[]>([]);
  inputText = '';
  isTyping = signal(false);
  useRag = signal(false);

  shouldScrollToBottom = false;

  readonly welcomeMessage: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content: "Hello! I'm your GoPay assistant. Ask me anything about your payments, trips, or fleet — I'm here to help.",
    timestamp: new Date(),
    status: 'delivered',
  };

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId;
    }
    this.messages.set([this.welcomeMessage]);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  get hasMessages(): boolean {
    return this.messages().length > 1;
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isTyping()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      status: 'sending',
    };

    this.messages.update(msgs => [...msgs, userMsg]);
    this.inputText = '';
    this.isTyping.set(true);
    this.shouldScrollToBottom = true;
    this.cdr.detectChanges();

    const payload: ChatRequest = {
      entityId: this.entityId!,
      sessionId: this.sessionId ?? undefined,
      message: text,
      useRag: this.useRag(),
    };

    this.dataService
      .post<ChatResponse>(AI_ENDPOINTS.CHAT_SEND, payload, 'chatbot', true, true)
      .subscribe({
        next: (res) => {
          this.sessionId = res.sessionId;

          // mark user message delivered
          this.messages.update(msgs =>
            msgs.map(m => m.id === userMsg.id ? { ...m, status: 'delivered' } : m)
          );

          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: res.reply,
            timestamp: new Date(),
            status: 'delivered',
            sources: res.sources,
            intentDetected: res.intentDetected,
            confidence: res.confidence,
          };

          this.messages.update(msgs => [...msgs, assistantMsg]);
          this.isTyping.set(false);
          this.shouldScrollToBottom = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Chat error', err);
          this.messages.update(msgs =>
            msgs.map(m => m.id === userMsg.id ? { ...m, status: 'error' } : m)
          );
          this.isTyping.set(false);
          this.messageService.add({
            severity: 'error', summary: 'Error',
            detail: 'Failed to send message. Please try again.', life: 3000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  toggleRag(): void {
    this.useRag.update(v => !v);
    this.messageService.add({
      severity: 'info',
      summary: this.useRag() ? 'RAG Enabled' : 'RAG Disabled',
      detail: this.useRag()
        ? 'Responses will now include knowledge-base context.'
        : 'Standard chat mode.',
      life: 2500,
    });
  }

  clearChat(): void {
    this.messages.set([this.welcomeMessage]);
    this.sessionId = null;
    this.isTyping.set(false);
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch { }
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  trackByMessage(_: number, msg: ChatMessage): string {
    return msg.id;
  }
}
