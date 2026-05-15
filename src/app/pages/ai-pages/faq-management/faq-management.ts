// pages/faq/faq-management.component.ts
import {
  Component, OnInit, ChangeDetectorRef, signal, ViewChild, ElementRef, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChipModule } from 'primeng/chip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { DataService } from '../../../../@core/api/data.service';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { AI_ENDPOINTS } from '../../../../@core/api/endpoints/AI_ENDPOINTS';
import {
  FaqEntry, FaqCreateRequest, RagDocument
} from '../../../../@core/models/ai/ai.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-faq-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, TableModule,
    ButtonModule, DialogModule, InputTextModule, TooltipModule,
    ToastModule, TagModule, TabsModule, ConfirmDialogModule,
    ProgressBarModule, ChipModule,
  ],
  templateUrl: './faq-management.html',
  styleUrls: ['./faq-management.css', '../../../../styles/global/_toast.css'],
  providers: [MessageService, ConfirmationService],
})
export class FaqManagementComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  entityId: string | null = null;

  // ── FAQs ─────────────────────────────────────────────────────
  faqs: FaqEntry[] = [];
  filteredFaqs: FaqEntry[] = [];
  faqSearchTerm = '';

  // Category filter
  categories: string[] = [];
  selectedCategory = '';

  // Expanded cards
  expandedFaqIds = new Set<string>();

  // ── Documents ─────────────────────────────────────────────────
  documents: RagDocument[] = [];
  filteredDocs: RagDocument[] = [];
  docSearchTerm = '';
  isUploading = signal(false);
  uploadProgress = signal(0);
  isDragOver = signal(false);

  // ── Ingest / embed ────────────────────────────────────────────
  isIngesting = signal(false);
  ingestMessage = signal('');
  ingestStatus = signal<'idle' | 'done' | 'error'>('idle');
  lastIngestedCount = signal<number | null>(null);

  // ── Shared ────────────────────────────────────────────────────
  activeTab = 0;
  isDirty = false;

  // ── FAQ Dialog ────────────────────────────────────────────────
  showFaqDialog = false;
  isEditingFaq = false;
  faqDialogTitle = '';
  isSavingFaq = false;
  editingFaqId: string | null = null;

  faqForm = {
    question: '',
    answer: '',
    category: '',
    tagInput: '',
    tags: [] as string[],
  };

  // ── Stats (computed) ──────────────────────────────────────────
  get totalTags(): number {
    return this.faqs.reduce((s, f) => s + (f.tags?.length ?? 0), 0);
  }

  get taggedFaqCount(): number {
    return this.faqs.filter(f => (f.tags?.length ?? 0) > 0).length;
  }

  get uncategorisedCount(): number {
    return this.faqs.filter(f => !f.category).length;
  }

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    public router: Router,
    public loadingStore: LoadingStore,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId
      // console.log('Logged in as:', user.username);
    } else {
      this.router.navigate(['/login']);
      console.log('No user logged in');
    }

    this.loadFaqs();
    this.loadDocuments();
  }

  // ── FAQ CRUD ──────────────────────────────────────────────────

  loadFaqs(): void {
    this.dataService
      .getWithoutParams<{ data: FaqEntry[] }>(AI_ENDPOINTS.FAQ_LIST, 'rag', true, true)
      .subscribe({
        next: (res) => {
          this.faqs = res.data ?? (res as any);
          this._refreshCategories();
          this.applyFaqFilter();
          this.isDirty = false;
          this.cdr.detectChanges();
        },
        error: () => this.messageService.add({
          severity: 'error', summary: 'Error', detail: 'Failed to load FAQs.', life: 3000,
        }),
      });
  }

  private _refreshCategories(): void {
    this.categories = Array.from(
      new Set(this.faqs.map(f => f.category).filter(Boolean) as string[])
    ).sort();
  }

  applyFaqFilter(): void {
    let result = [...this.faqs];

    if (this.selectedCategory) {
      result = result.filter(f => f.category === this.selectedCategory);
    }

    if (this.faqSearchTerm.trim()) {
      const q = this.faqSearchTerm.toLowerCase();
      result = result.filter(f =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q) ||
        f.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    this.filteredFaqs = result;
  }

  setCategoryFilter(cat: string): void {
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;
    this.applyFaqFilter();
  }

  toggleExpand(id: string): void {
    if (this.expandedFaqIds.has(id)) {
      this.expandedFaqIds.delete(id);
    } else {
      this.expandedFaqIds.add(id);
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedFaqIds.has(id);
  }

  openCreateFaq(): void {
    this.isEditingFaq = false;
    this.faqDialogTitle = 'Add FAQ Entry';
    this.editingFaqId = null;
    this.faqForm = { question: '', answer: '', category: '', tagInput: '', tags: [] };
    this.showFaqDialog = true;
  }

  openEditFaq(faq: FaqEntry, event: Event): void {
    event.stopPropagation();
    this.isEditingFaq = true;
    this.faqDialogTitle = 'Edit FAQ Entry';
    this.editingFaqId = faq.id;
    this.faqForm = {
      question: faq.question,
      answer: faq.answer,
      category: faq.category ?? '',
      tagInput: '',
      tags: [...(faq.tags ?? [])],
    };
    this.showFaqDialog = true;
  }

  addFormTag(): void {
    const v = this.faqForm.tagInput.trim();
    if (!v || this.faqForm.tags.includes(v)) return;
    this.faqForm.tags = [...this.faqForm.tags, v];
    this.faqForm.tagInput = '';
  }

  removeFormTag(tag: string): void {
    this.faqForm.tags = this.faqForm.tags.filter(t => t !== tag);
  }

  onTagInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addFormTag();
    }
  }

  saveFaq(): void {
    if (!this.faqForm.question.trim() || !this.faqForm.answer.trim()) {
      this.messageService.add({
        severity: 'warn', summary: 'Validation', detail: 'Question and answer are required.', life: 2500,
      });
      return;
    }

    const payload: FaqCreateRequest = {
      question: this.faqForm.question.trim(),
      answer: this.faqForm.answer.trim(),
      category: this.faqForm.category.trim() || undefined,
      tags: this.faqForm.tags.length ? this.faqForm.tags : undefined,
    };

    this.isSavingFaq = true;

    const req$ = this.isEditingFaq && this.editingFaqId
      ? this.dataService.put(`${AI_ENDPOINTS.FAQ_UPDATE}/${this.editingFaqId}`, payload, 'rag', true, true)
      : this.dataService.post(AI_ENDPOINTS.FAQ_CREATE, payload, 'rag', true, true);

    req$.subscribe({
      next: () => {
        this.isSavingFaq = false;
        this.showFaqDialog = false;
        this.messageService.add({
          severity: 'success', summary: 'Saved',
          detail: `FAQ ${this.isEditingFaq ? 'updated' : 'created'}.`, life: 3000,
        });
        this.loadFaqs();
      },
      error: () => {
        this.isSavingFaq = false;
        this.messageService.add({
          severity: 'error', summary: 'Error', detail: 'Failed to save FAQ.', life: 3000,
        });
      },
    });
  }

  confirmDeleteFaq(faq: FaqEntry, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `Delete "<strong>${faq.question.slice(0, 60)}…</strong>"?`,
      header: 'Delete FAQ',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.dataService
          .delete(`${AI_ENDPOINTS.FAQ_DELETE}/${faq.id}`, 'rag', true, true)
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success', summary: 'Deleted', life: 2500, detail: 'FAQ removed.',
              });
              this.loadFaqs();
            },
            error: () => this.messageService.add({
              severity: 'error', summary: 'Error', detail: 'Failed to delete FAQ.', life: 3000,
            }),
          });
      },
    });
  }

  // ── Ingest (re-embed into vector store) ───────────────────────

  ingestFaqs(): void {
    if (this.faqs.length === 0) return;
    this.isIngesting.set(true);
    this.ingestMessage.set('');
    this.ingestStatus.set('idle');

    this.dataService.post(AI_ENDPOINTS.FAQ_INGEST, {}, 'rag', true, true).subscribe({
      next: (res: any) => {
        this.isIngesting.set(false);
        this.ingestStatus.set('done');
        const count = res?.ingested ?? res?.data?.ingested ?? this.faqs.length;
        this.lastIngestedCount.set(count);
        this.ingestMessage.set(`${count} FAQs successfully embedded into the vector store.`);
        this.messageService.add({
          severity: 'success', summary: 'Ingestion Complete',
          detail: `${count} FAQs re-embedded.`, life: 4000,
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.isIngesting.set(false);
        this.ingestStatus.set('error');
        this.ingestMessage.set('Re-embedding failed. Check server logs.');
        this.messageService.add({
          severity: 'error', summary: 'Error', detail: 'Ingestion failed.', life: 3000,
        });
        this.cdr.detectChanges();
      },
    });
  }

  // ── Documents ──────────────────────────────────────────────────

  loadDocuments(): void {
    this.dataService
      .getWithoutParams<{ data: RagDocument[] }>(AI_ENDPOINTS.RAG_DOCUMENTS_LIST, 'rag', true, true)
      .subscribe({
        next: (res) => {
          this.documents = res.data ?? (res as any);
          this.applyDocFilter();
          this.cdr.detectChanges();
        },
        error: () => this.messageService.add({
          severity: 'error', summary: 'Error', detail: 'Failed to load documents.', life: 3000,
        }),
      });
  }

  applyDocFilter(): void {
    if (!this.docSearchTerm.trim()) {
      this.filteredDocs = [...this.documents];
      return;
    }
    const q = this.docSearchTerm.toLowerCase();
    this.filteredDocs = this.documents.filter(d =>
      d.originalName.toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q)
    );
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragOver.set(true); }
  onDragLeave(): void { this.isDragOver.set(false); }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver.set(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) this.uploadFile(files[0]);
  }

  triggerFileInput(): void { this.fileInput?.nativeElement.click(); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
      input.value = '';
    }
  }

  uploadFile(file: File): void {
    const allowed = [
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) {
      this.messageService.add({
        severity: 'warn', summary: 'Unsupported File',
        detail: 'Only PDF, TXT, DOC, DOCX are supported.', life: 3000,
      });
      return;
    }

    this.isUploading.set(true);
    this.uploadProgress.set(0);

    const formData = new FormData();
    formData.append('file', file);

    const interval = setInterval(() => {
      const curr = this.uploadProgress();
      if (curr < 85) {
        this.uploadProgress.update(v => v + Math.random() * 15);
        this.cdr.detectChanges();
      }
    }, 300);

    this.dataService
      .postFormData(AI_ENDPOINTS.RAG_DOCUMENT_UPLOAD, formData, 'rag', true, true)
      .subscribe({
        next: () => {
          clearInterval(interval);
          this.uploadProgress.set(100);
          this.isUploading.set(false);
          this.messageService.add({
            severity: 'success', summary: 'Uploaded',
            detail: `"${file.name}" is being indexed.`, life: 4000,
          });
          setTimeout(() => this.loadDocuments(), 1000);
          this.cdr.detectChanges();
        },
        error: () => {
          clearInterval(interval);
          this.isUploading.set(false);
          this.uploadProgress.set(0);
          this.messageService.add({
            severity: 'error', summary: 'Upload Failed',
            detail: `Failed to upload "${file.name}".`, life: 3000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  confirmDeleteDoc(doc: RagDocument): void {
    this.confirmationService.confirm({
      message: `Delete document "<strong>${doc.originalName}</strong>"? All indexed chunks will be removed.`,
      header: 'Delete Document',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.dataService
          .delete(`${AI_ENDPOINTS.RAG_DOCUMENT_DELETE}/${doc.id}`, 'rag', true, true)
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success', summary: 'Deleted', detail: 'Document removed.', life: 2500,
              });
              this.loadDocuments();
            },
            error: () => this.messageService.add({
              severity: 'error', summary: 'Error', detail: 'Failed to delete document.', life: 3000,
            }),
          });
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────

  getDocStatusSeverity(status: string): string {
    switch (status) {
      case 'indexed': return 'success';
      case 'processing': return 'info';
      case 'error': return 'danger';
      default: return 'secondary';
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  getMimeIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'pi pi-file-pdf';
    if (mimeType.includes('word')) return 'pi pi-file-word';
    if (mimeType.includes('text')) return 'pi pi-file';
    return 'pi pi-file';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  get loading() { return this.loadingStore.loading; }
}
