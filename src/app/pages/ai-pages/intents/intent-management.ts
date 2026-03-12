// pages/intents/intent-management.component.ts
import {
  Component, OnInit, ChangeDetectorRef, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BadgeModule } from 'primeng/badge';
import { MessageService, ConfirmationService } from 'primeng/api';

import { DataService } from '../../../../@core/api/data.service';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { AI_ENDPOINTS } from '../../../../@core/api/endpoints/AI_ENDPOINTS';
import {
  FetchApiIntent,
  Intent, IntentCreateRequest, IntentUpdateRequest,
  ModelStatus, ModelStatusResponse, RetrainResponse
} from '../../../../@core/models/ai/ai.models';

@Component({
  selector: 'app-intent-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, TableModule,
    ButtonModule, DialogModule, InputTextModule, TextareaModule,
    TooltipModule, ToastModule, TagModule, ToggleButtonModule,
    ProgressBarModule, ConfirmDialogModule, BadgeModule,
  ],
  templateUrl: './intent-management.html',
  styleUrls: ['./intent-management.css', '../../../../styles/global/_toast.css'],
  providers: [MessageService, ConfirmationService],
})
export class IntentManagementComponent implements OnInit {
  intents: Intent[] = [];
  filteredIntents: Intent[] = [];
  searchTerm = '';

  modelStatus = signal<ModelStatus | null>(null);
  isRetraining = signal(false);
  isLoadingStatus = signal(false);

  // Dialog
  showDialog = false;
  isEditing = false;
  dialogTitle = '';
  isSaving = false;

  // Form fields
  form = {
    name: '',
    displayName: '',
    description: '',
    trainingPhrases: '' as string,   // newline-separated input
    responses: '' as string,          // newline-separated input
  };

  editingId: string | null = null;

  // Training phrase chip management
  newPhrase = '';
  newResponse = '';

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    public loadingStore: LoadingStore,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }


  ngOnInit(): void {
    this.loadIntents();
    this.loadModelStatus();
  }

  // ── Data Loading ────────────────────────────────────────────
  loadIntents(): void {
    this.loadingStore.start();
    this.dataService
      .getWithoutParams<FetchApiIntent>(AI_ENDPOINTS.INTENT_LIST, 'intents', true, true)
      .subscribe({
        next: (res) => {
          // Handle both { data: { intents: [] } } and other formats
          const rawData = res?.intents || res;
          this.intents = Array.isArray(rawData) ? rawData : [];
          this.applyFilter();
          this.loadingStore.stop();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load intents', err);
          this.loadingStore.stop();
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load intents.', life: 3000 });
        }
      });
  }

  loadModelStatus(): void {
    this.isLoadingStatus.set(true);
    this.dataService
      .getWithoutParams<ModelStatusResponse>(AI_ENDPOINTS.INTENT_MODEL_STATUS, 'intents', true, true)
      .subscribe({
        next: (res) => {
          if (res && res.model && res.intent_store) {
            const model = res.model;
            const intent_store = res.intent_store;
            // Map the complex backend response to our UI signal
            this.modelStatus.set({
              status: model.loaded ? 'ready' : 'loading',
              totalIntents: intent_store.intents,
              device: model.device,
              tags: model.tags,
              totalPhrases: model.vocab_size
            });
          }
          this.isLoadingStatus.set(false);
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoadingStatus.set(false);
        },
      });
  }

  // ── Filter ──────────────────────────────────────────────────
  applyFilter(): void {
    if (!Array.isArray(this.intents)) {
      this.filteredIntents = [];
      return;
    }
    if (!this.searchTerm.trim()) {
      this.filteredIntents = [...this.intents];
      return;
    }
    const q = this.searchTerm.toLowerCase();
    this.filteredIntents = this.intents.filter(i =>
      i.displayName?.toLowerCase().includes(q) ||
      i.tag?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q)
    );
  }

  // ── CRUD ────────────────────────────────────────────────────
  openCreate(): void {
    this.isEditing = false;
    this.dialogTitle = 'Create Intent';
    this.editingId = null;
    this.form = { name: '', displayName: '', description: '', trainingPhrases: '', responses: '' };
    this.showDialog = true;
  }

  openEdit(intent: Intent): void {
    this.isEditing = true;
    this.dialogTitle = 'Edit Intent';
    this.editingId = intent.tag;

    // Safely handle both TrainingPhrase objects and plain strings
    const phraseStrings = (intent.patterns || []).map(p =>
      typeof p === 'string' ? p : p
    );

    this.form = {
      name: intent.tag,
      displayName: intent.tag,
      description: intent.description ?? '',
      trainingPhrases: phraseStrings.join('\n'),
      responses: (intent.responses || []).join('\n'),
    };
    this.showDialog = true;
  }

  saveIntent(): void {
    if (!this.form.displayName.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Display name is required.', life: 2500 });
      return;
    }

    const phrases = this.form.trainingPhrases.split('\n').map(s => s.trim()).filter(Boolean);
    const responses = this.form.responses.split('\n').map(s => s.trim()).filter(Boolean);

    const payload: IntentCreateRequest = {
      name: this.form.name || this.form.displayName.toLowerCase().replace(/\s+/g, '_'),
      displayName: this.form.displayName,
      description: this.form.description || undefined,
      trainingPhrases: phrases,
      responses,
      tag: this.form.displayName,
      patterns: phrases
    };

    this.isSaving = true;

    const request$ = this.isEditing && this.editingId
      ? this.dataService.put<Intent>(`${AI_ENDPOINTS.INTENT_UPDATE}/${this.editingId}`, payload, 'intents', true, true)
      : this.dataService.post<Intent>(AI_ENDPOINTS.INTENT_CREATE, payload, 'intents', true, true);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.showDialog = false;
        this.messageService.add({
          severity: 'success', summary: 'Saved',
          detail: `Intent "${payload.displayName}" ${this.isEditing ? 'updated' : 'created'}.`,
          life: 3000,
        });
        this.loadIntents();
      },
      error: (err) => {
        console.error('Save intent error', err);
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save intent.', life: 3000 });
      },
    });
  }

  confirmDelete(intent: Intent): void {
    this.confirmationService.confirm({
      message: `Delete intent "<strong>${intent.displayName}</strong>"? This cannot be undone.`,
      header: 'Delete Intent',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteIntent(intent.tag),
    });
  }

  deleteIntent(id: string): void {
    this.dataService
      .delete(`${AI_ENDPOINTS.INTENT_DELETE}/${id}`, 'intents', true, true)
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Intent removed.', life: 2500 });
          this.loadIntents();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete intent.', life: 3000 });
        },
      });
  }

  toggleActive(intent: Intent): void {
    const payload: IntentUpdateRequest = { isActive: !intent.isActive };
    this.dataService
      .put<Intent>(`${AI_ENDPOINTS.INTENT_UPDATE}/${intent.id}`, payload, 'intents', true, true)
      .subscribe({
        next: () => {
          intent.isActive = !intent.isActive;
          this.cdr.detectChanges();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to toggle intent status.', life: 3000 });
        },
      });
  }

  // ── Retrain ─────────────────────────────────────────────────
  triggerRetrain(): void {
    this.isRetraining.set(true);
    this.dataService
      .post<RetrainResponse>(AI_ENDPOINTS.INTENT_RETRAIN, {}, 'intents', true, true)
      .subscribe({
        next: (res) => {
          this.messageService.add({
            severity: 'info', summary: 'Training Started',
            detail: `Job ${res.jobId} queued. This may take a few minutes.`,
            life: 5000,
          });
          // Poll status after delay
          setTimeout(() => {
            this.isRetraining.set(false);
            this.loadModelStatus();
          }, 5000);
        },
        error: () => {
          this.isRetraining.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to start training.', life: 3000 });
        },
      });
  }

  // ── Helpers ─────────────────────────────────────────────────
  getStatusSeverity(status?: string): string {
    switch (status) {
      case 'ready': return 'success';
      case 'training': return 'info';
      case 'error': return 'danger';
      case 'not_trained': return 'warning';
      default: return 'secondary';
    }
  }

  getStatusIcon(status?: string): string {
    switch (status) {
      case 'ready': return 'pi pi-check-circle';
      case 'training': return 'pi pi-spin pi-spinner';
      case 'error': return 'pi pi-times-circle';
      case 'not_trained': return 'pi pi-exclamation-circle';
      default: return 'pi pi-circle';
    }
  }

  truncate(text: any, limit: number = 24): string {
    if (!text) return '';
    return text.length > limit ? text.slice(0, limit) + '…' : text;
  }
}
