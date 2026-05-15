import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { ActionButtonComponent } from "../../../components/action-button/action-button";

export type SourceType = 'faq' | 'faq_pro' | 'privacy_policy' | 'app_guide';

export interface RagChunk {
  id: string;
  source_type: SourceType;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface SourceMeta {
  label: string;
  desc: string;
  icon: string;
  reEmbedEndpoint: string | null;
}

@Component({
  standalone: true,
  selector: 'app-rag-manager',
  templateUrl: './rag-manager.html',
  styleUrls: [
    './rag-manager.css',
    '../../../../styles/modules/_cards.css',
    '../../../../styles/global/_grid_layout.css',
    '../../../../styles/modules/_filter_actions.css',
    '../../../../styles/global/_toast.css'
  ],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    DialogModule,
    TooltipModule,
    ProgressSpinnerModule,
    InputTextModule,
    TagModule,
    ToastModule,
    ActionButtonComponent
  ],
  providers: [MessageService],
})
export class RagManagerComponent implements OnInit {
  // ── Source navigation ──────────────────────────────────────────
  currentSource: SourceType = 'faq';

  sourceMeta: Record<SourceType, SourceMeta> = {
    faq: {
      label: 'FAQ Data',
      desc: 'Frequently asked questions',
      icon: 'pi pi-question-circle',
      reEmbedEndpoint: '/faq/ingest',
    },
    faq_pro: {
      label: 'FAQ Pro',
      desc: 'Extended FAQ with categories',
      icon: 'pi pi-star',
      reEmbedEndpoint: null,
    },
    privacy_policy: {
      label: 'Privacy Policy',
      desc: 'Privacy policy chunks',
      icon: 'pi pi-shield',
      reEmbedEndpoint: null,
    },
    app_guide: {
      label: 'App Guide',
      desc: 'Driver & passenger app guide',
      icon: 'pi pi-map',
      reEmbedEndpoint: null,
    },
  };

  sourceKeys: SourceType[] = ['faq', 'faq_pro', 'privacy_policy', 'app_guide'];

  // ── Data ───────────────────────────────────────────────────────
  allChunks: RagChunk[] = [];
  filteredChunks: RagChunk[] = [];
  counts: Partial<Record<SourceType, number>> = {};

  // ── Search ─────────────────────────────────────────────────────
  searchTerm = '';

  // ── API status ─────────────────────────────────────────────────
  apiOnline = false;

  // ── Entry dialog ───────────────────────────────────────────────
  displayEntryDialog = false;
  editingChunk: RagChunk | null = null;

  form = {
    title: '',
    content: '',
    category: '',
    tags: '',
    howTo: '',
    outcome: '',
  };

  // ── Delete dialog ──────────────────────────────────────────────
  displayDeleteDialog = false;
  deleteTargetId: string | null = null;
  deleteTargetName = '';

  // ── Re-embed loading ───────────────────────────────────────────
  reEmbedLoading = false;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  get currentMeta(): SourceMeta {
    return this.sourceMeta[this.currentSource];
  }

  get uniqueCategories(): number {
    return new Set(this.allChunks.map((c) => c.category).filter(Boolean)).size;
  }

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.checkApiHealth();
    this.loadSource('faq');
    this.loadAllCounts();
  }

  // ── API helpers ────────────────────────────────────────────────
  private readonly API = 'http://localhost:8002/api/v1';

  private async apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const res = await fetch(this.API + path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => res.statusText);
      throw new Error(txt || res.statusText);
    }
    return res.json();
  }

  async checkApiHealth(): Promise<void> {
    try {
      await this.apiFetch('/health');
      this.apiOnline = true;
    } catch {
      this.apiOnline = false;
    }
  }

  // ── Load data ──────────────────────────────────────────────────
  async loadSource(source: SourceType): Promise<void> {
    this.currentSource = source;
    this.searchTerm = '';
    this.loadingStore.start();
    try {
      const data = await this.apiFetch<{ data: RagChunk[] }>(
        `/rag-data?source_type=${source}`
      );
      this.allChunks = data.data || [];
      this.counts[source] = this.allChunks.length;
      this.applySearch();
    } catch (e: any) {
      this.toast('error', 'Load failed', e.message);
    } finally {
      this.loadingStore.stop();
      this.cdr.detectChanges();
    }
  }

  async loadAllCounts(): Promise<void> {
    for (const src of this.sourceKeys) {
      try {
        const data = await this.apiFetch<{ data: RagChunk[] }>(
          `/rag-data?source_type=${src}`
        );
        this.counts[src] = (data.data || []).length;
      } catch {
        /* silent */
      }
    }
    this.cdr.detectChanges();
  }

  // ── Navigation ─────────────────────────────────────────────────
  switchSource(source: SourceType): void {
    this.loadSource(source);
  }

  // ── Search ─────────────────────────────────────────────────────
  applySearch(): void {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) {
      this.filteredChunks = [...this.allChunks];
    } else {
      this.filteredChunks = this.allChunks.filter(
        (c) =>
          (c.title || '').toLowerCase().includes(q) ||
          (c.content || '').toLowerCase().includes(q) ||
          (c.category || '').toLowerCase().includes(q) ||
          (c.tags || []).join(' ').toLowerCase().includes(q)
      );
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applySearch();
  }

  onSearchChange(): void {
    this.applySearch();
  }

  // ── Create / Edit dialog ───────────────────────────────────────
  openCreateDialog(): void {
    this.editingChunk = null;
    this.form = { title: '', content: '', category: '', tags: '', howTo: '', outcome: '' };
    this.displayEntryDialog = true;
  }

  openEditDialog(chunk: RagChunk): void {
    this.editingChunk = chunk;
    this.form = {
      title: chunk.title || '',
      content:
        this.currentSource === 'app_guide'
          ? (chunk.content || '').split('\n\nHow to:')[0]
          : chunk.content || '',
      category: chunk.category || '',
      tags: (chunk.tags || []).join(', '),
      howTo: chunk.metadata?.['how_to'] || '',
      outcome: chunk.metadata?.['expected_outcome'] || '',
    };
    this.displayEntryDialog = true;
  }

  closeEntryDialog(): void {
    this.displayEntryDialog = false;
    this.editingChunk = null;
  }

  async saveEntry(): Promise<void> {
    if (!this.form.title.trim() || !this.form.content.trim()) {
      this.toast('warn', 'Validation', 'Title and content are required.');
      return;
    }

    const tags = this.form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const metadata: Record<string, string> = {};
    if (this.currentSource === 'app_guide') {
      metadata['how_to'] = this.form.howTo;
      metadata['expected_outcome'] = this.form.outcome;
    }

    const payload = {
      title: this.form.title.trim(),
      content: this.form.content.trim(),
      category: this.form.category.trim() || null,
      tags,
      metadata,
    };

    this.loadingStore.start();
    try {
      if (this.editingChunk) {
        await this.apiFetch(`/rag-data/${this.editingChunk.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        this.toast('success', 'Saved', 'Entry updated successfully.');
      } else {
        await this.apiFetch('/rag-data', {
          method: 'POST',
          body: JSON.stringify({ source_type: this.currentSource, ...payload }),
        });
        this.toast('success', 'Created', 'Entry added successfully.');
      }
      this.closeEntryDialog();
      await this.loadSource(this.currentSource);
    } catch (e: any) {
      this.toast('error', 'Save failed', e.message);
    } finally {
      this.loadingStore.stop();
    }
  }

  // ── Delete dialog ──────────────────────────────────────────────
  openDeleteDialog(chunk: RagChunk): void {
    this.deleteTargetId = chunk.id;
    this.deleteTargetName = chunk.title || 'this entry';
    this.displayDeleteDialog = true;
  }

  closeDeleteDialog(): void {
    this.displayDeleteDialog = false;
    this.deleteTargetId = null;
  }

  async confirmDelete(): Promise<void> {
    if (!this.deleteTargetId) return;
    this.loadingStore.start();
    try {
      await this.apiFetch(`/rag-data/${this.deleteTargetId}`, { method: 'DELETE' });
      this.toast('success', 'Deleted', 'Entry removed.');
      this.closeDeleteDialog();
      await this.loadSource(this.currentSource);
    } catch (e: any) {
      this.toast('error', 'Delete failed', e.message);
    } finally {
      this.loadingStore.stop();
    }
  }

  // ── Re-embed ───────────────────────────────────────────────────
  async triggerReEmbed(): Promise<void> {
    this.reEmbedLoading = true;
    try {
      if (
        this.currentSource === 'faq' ||
        this.currentSource === 'faq_pro'
      ) {
        await this.apiFetch('/faq/ingest', { method: 'POST' });
      } else {
        await this.apiFetch('/ingest', {
          method: 'POST',
          body: JSON.stringify({
            documents: this.filteredChunks.map((c) => c.content),
            metadata: this.filteredChunks.map((c) => ({
              source: c.source_type,
              title: c.title,
              category: c.category,
            })),
            backend: 'document',
          }),
        });
      }
      this.toast('success', 'Re-embedded', 'Vector store updated.');
    } catch (e: any) {
      this.toast('error', 'Re-embed failed', e.message);
    } finally {
      this.reEmbedLoading = false;
    }
  }

  async triggerFullReEmbed(): Promise<void> {
    this.toast('info', 'Re-embedding', 'Starting full re-embed across all sources…');
    try {
      await this.apiFetch('/faq/ingest', { method: 'POST' });
      this.toast('success', 'Done', 'All sources re-embedded.');
    } catch (e: any) {
      this.toast('error', 'Full re-embed failed', e.message);
    }
  }

  async refreshAll(): Promise<void> {
    await this.loadSource(this.currentSource);
    await this.loadAllCounts();
    this.toast('info', 'Refreshed', 'Data reloaded.');
  }

  // ── Helpers ────────────────────────────────────────────────────
  contentPreview(chunk: RagChunk): string {
    const text = chunk.content || '';
    return text.length > 120 ? text.substring(0, 120) + '…' : text;
  }

  getCategoryTagSeverity(
    source: SourceType
  ): 'success' | 'info' | 'warn' | 'danger' | undefined {

    const map: Record<
      SourceType,
      'success' | 'info' | 'warn'
    > = {
      faq: 'info',
      faq_pro: 'success',
      privacy_policy: 'info',
      app_guide: 'warn',
    };

    return map[source];
  }

  private toast(
    severity: 'success' | 'info' | 'warn' | 'error',
    summary: string,
    detail: string
  ): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
