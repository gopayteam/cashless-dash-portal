// components/chat-widget/chat-widget.component.ts
import {
  Component, OnInit, AfterViewChecked, ViewChild, ElementRef,
  ChangeDetectorRef, signal, Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { DataService } from '../../../../@core/api/data.service';
import { AuthService } from '../../../../@core/services/auth.service';
import { AI_ENDPOINTS } from '../../../../@core/models/ai//ai.endpoints';
import { ChatMessage, ChatRequest, ChatResponse } from '../../../../@core/models/ai/ai.models';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, BadgeModule,
    TooltipModule, ToastModule,
  ],
  templateUrl: './chat-widget.html',
  styleUrls: ['./chat-widget.css'],
  providers: [MessageService],
})
export class ChatWidgetComponent implements OnInit, AfterViewChecked {
  @ViewChild('widgetMessagesEnd') messagesEnd!: ElementRef;
  @Input() position: 'bottom-right' | 'bottom-left' = 'bottom-right';

  isOpen = signal(false);
  entityId: string | null = null;
  sessionId: string | null = null;

  messages = signal<ChatMessage[]>([]);
  inputText = '';
  isTyping = signal(false);
  unreadCount = signal(0);

  shouldScroll = false;

  readonly welcomeMessage: ChatMessage = {
    id: 'welcome-widget',
    role: 'assistant',
    content: "👋 Hi! How can I help you today?",
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
    if (user) this.entityId = user.entityId;
    this.messages.set([this.welcomeMessage]);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggle(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.unreadCount.set(0);
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  close(): void {
    this.isOpen.set(false);
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
    this.shouldScroll = true;
    this.cdr.detectChanges();

    const payload: ChatRequest = {
      entityId: this.entityId!,
      sessionId: this.sessionId ?? undefined,
      text: text,
    };

    this.dataService
      .post<ChatResponse>(AI_ENDPOINTS.CHAT_SEND, payload, 'chatbot')
      .subscribe({
        next: (res) => {
          this.sessionId = res.data.conversation_id;
          this.messages.update(msgs =>
            msgs.map(m => m.id === userMsg.id ? { ...m, status: 'delivered' } : m)
          );

          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: res.data.response,
            timestamp: new Date(),
            status: 'delivered',
          };

          this.messages.update(msgs => [...msgs, assistantMsg]);
          this.isTyping.set(false);
          this.shouldScroll = true;

          if (!this.isOpen()) {
            this.unreadCount.update(v => v + 1);
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.messages.update(msgs =>
            msgs.map(m => m.id === userMsg.id ? { ...m, status: 'error' } : m)
          );
          this.isTyping.set(false);
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

  clearWidget(): void {
    this.messages.set([this.welcomeMessage]);
    this.sessionId = null;
    this.unreadCount.set(0);
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch { }
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  trackByMessage(_: number, msg: ChatMessage): string { return msg.id; }
}
