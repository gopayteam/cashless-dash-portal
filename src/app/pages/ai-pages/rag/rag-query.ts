// pages/rag/rag-query.component.ts
import {
  Component, OnInit, ChangeDetectorRef, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { SliderModule } from 'primeng/slider';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { DataService } from '../../../../@core/api/data.service';
import { AuthService } from '../../../../@core/services/auth.service';
import { RagQueryRequest, RagQueryResponse } from '../../../../@core/models/ai/ai.models';
import { AI_ENDPOINTS } from '../../../../@core/models/ai/ai.endpoints';

export type ViewMode = 'chat' | 'research';

interface QueryHistoryItem {
  id: string;
  query: string;
  response: RagQueryResponse;
  timestamp: Date;
}

@Component({
  selector: 'app-rag-query',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule,
    InputTextModule, TooltipModule, ToastModule, SliderModule,
    DividerModule, ProgressSpinnerModule,
  ],
  templateUrl: './rag-query.html',
  styleUrls: ['./rag-query.css'],
  providers: [MessageService],
})
export class RagQueryComponent implements OnInit {
  entityId: string | null = null;

  queryText = '';
  topK = 5;
  isLoading = signal(false);
  viewMode = signal<ViewMode>('research');

  currentResult = signal<RagQueryResponse | null>(null);
  history = signal<QueryHistoryItem[]>([]);

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) this.entityId = user.entityId;
  }

  submitQuery(): void {
    const q = this.queryText.trim();
    if (!q || this.isLoading()) return;

    this.isLoading.set(true);
    this.currentResult.set(null);

    const payload: RagQueryRequest = {
      entityId: this.entityId!,
      query: q,
      topK: this.topK,
    };

    this.dataService
      .post<RagQueryResponse>(AI_ENDPOINTS.RAG_QUERY, payload, 'rag')
      .subscribe({
        next: (res) => {
          this.currentResult.set(res);
          this.history.update(h => [{
            id: crypto.randomUUID(),
            query: q,
            response: res,
            timestamp: new Date(),
          }, ...h]);
          this.isLoading.set(false);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('RAG query error', err);
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'error', summary: 'Query Failed',
            detail: 'Could not retrieve answer. Please try again.',
            life: 3500,
          });
          this.cdr.detectChanges();
        },
      });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitQuery();
    }
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  loadFromHistory(item: QueryHistoryItem): void {
    this.queryText = item.query;
    this.currentResult.set(item.response);
  }

  clearHistory(): void {
    this.history.set([]);
    this.currentResult.set(null);
    this.queryText = '';
  }

  getScoreClass(score: number): string {
    if (score >= 0.8) return 'score-high';
    if (score >= 0.5) return 'score-med';
    return 'score-low';
  }

  formatMs(ms: number): string {
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
  }

  trackById(_: number, item: QueryHistoryItem): string {
    return item.id;
  }
}
