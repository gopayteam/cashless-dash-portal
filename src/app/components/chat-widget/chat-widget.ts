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

import { DataService } from '../../../@core/api/data.service';
import { AuthService } from '../../../@core/services/auth.service';
import { AI_ENDPOINTS } from '../../../@core/models/ai/ai.endpoints';
import { ChatMessage, ChatRequest, ChatResponse } from '../../../@core/models/ai/ai.models';
import { ChatService } from '../../../@core/services/chat.service';

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
    public chatService: ChatService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) this.entityId = user.entityId;
    this.messages = this.chatService.messages;
    this.isTyping = this.chatService.isTyping;
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
  if (!text) return;

  this.chatService.sendMessage(text);

  this.inputText = '';
  this.shouldScroll = true;

  if (!this.isOpen()) {
    this.unreadCount.update(v => v + 1);
  }
}

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearWidget(): void {
  this.chatService.clear();
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
