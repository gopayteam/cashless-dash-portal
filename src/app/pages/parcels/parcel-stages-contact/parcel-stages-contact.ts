import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { MessageService, ConfirmationService } from 'primeng/api';

import { DataService } from '../../../../@core/api/data.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { AuthService } from '../../../../@core/services/auth.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { ActionButtonComponent } from '../../../components/action-button/action-button';

import {
  StageContact,
  StageContactApiResponse,
  StageContactPayload,
  UpdateStageContactPayload,
} from '../../../../@core/models/parcels/stage-contact.model';

@Component({
  standalone: true,
  selector: 'app-stage-contacts',
  templateUrl: './parcel-stages-contact.html',
  styleUrls: [
    './parcel-stages-contact.css',
    '../../../../styles/modules/_filter_actions.css',
    '../../../../styles/global/_toast.css',
  ],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ProgressSpinnerModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SelectModule,
    ActionButtonComponent,
  ],
  providers: [MessageService, ConfirmationService],
})
export class StageContactsComponent implements OnInit {
  entityId: string | null = null;
  contacts: StageContact[] = [];

  // All stages fetched for the dropdown (size:50 on init)
  allStages: StageContact[] = [];
  loadingStages = false;

  // Stages available to assign (those without an existing contact)
  availableStages: StageContact[] = [];

  private lastEvent: any;

  // Pagination
  rows = 10;
  first = 0;
  totalRecords = 0;

  // ── Create dialog ────────────────────────────────────────────────────────
  showCreateDialog = false;
  selectedCreateStage: StageContact | null = null; // drives stageId inference
  createPhone = '';
  submittingCreate = false;

  // ── Edit dialog ──────────────────────────────────────────────────────────
  showEditDialog = false;
  selectedContact: StageContact | null = null;
  editPhone = '';
  submittingEdit = false;

  // ── Delete ───────────────────────────────────────────────────────────────
  deletingId: number | null = null;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId;
    } else {
      this.router.navigate(['/login']);
      return;
    }

    this.loadContacts({ first: 0, rows: this.rows });
    this.fetchAllStages();
  }

  // ── LIST ─────────────────────────────────────────────────────────────────

  loadContacts(event: any): void {
    this.lastEvent = event;
    this.fetchContacts(false, event);
  }

  fetchContacts(bypassCache: boolean, event?: any): void {
    this.loadingStore.start();

    const page =
      event && event.first !== undefined ? event.first / event.rows : 0;
    const size = event?.rows || this.rows;

    const payload = {
      entityId: this.entityId,
      page,
      size,
    };

    this.dataService
      .post<StageContactApiResponse>(
        API_ENDPOINTS.PARCEL_STAGE_LIST_CONTACT,
        payload,
        'parcel-stage-contacts',
        bypassCache
      )
      .subscribe({
        next: (response) => {
          if (response.status === 0) {
            this.contacts = response.data;
            this.totalRecords = response.totalRecords;
            this.rows = size;
            this.first = event?.first || 0;
            this.rebuildAvailableStages(); // keep dropdown in sync
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.message,
              life: 4000,
            });
          }
          this.loadingStore.stop();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load stage contacts', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Failed to load contacts',
            detail: err?.error?.message || 'Please try again',
            life: 4000,
          });
          this.loadingStore.stop();
        },
      });
  }

  refresh(): void {
    if (this.lastEvent) {
      this.fetchContacts(true, this.lastEvent);
    } else {
      this.fetchContacts(true, { first: 0, rows: this.rows });
    }
  }

  // Fetch the full stage list (up to 50) for the Create dropdown.
  // Re-called after any mutation so availableStages stays in sync.
  fetchAllStages(): void {
    this.loadingStages = true;

    const payload = { entityId: this.entityId, page: 0, size: 50 };

    this.dataService
      .post<StageContactApiResponse>(
        API_ENDPOINTS.PARCEL_STAGE_LIST_CONTACT,
        payload,
        'all-stages-dropdown',
        true // always bypass cache so list stays fresh
      )
      .subscribe({
        next: (response) => {
          this.loadingStages = false;
          if (response.status === 0) {
            this.allStages = response.data;
            this.rebuildAvailableStages();
          }
        },
        error: () => {
          this.loadingStages = false;
        },
      });
  }

  // Stages that do NOT already have a contact assigned.
  private rebuildAvailableStages(): void {
    const assignedIds = new Set(this.contacts.map((c) => c.stageId));
    this.availableStages = this.allStages.filter(
      (s) => !assignedIds.has(s.stageId)
    );
  }

  // ── CREATE ────────────────────────────────────────────────────────────────

  openCreateDialog(): void {
    this.selectedCreateStage = null;
    this.createPhone = '';
    this.showCreateDialog = true;
  }

  closeCreateDialog(): void {
    this.showCreateDialog = false;
    this.selectedCreateStage = null;
    this.createPhone = '';
  }

  isCreateFormValid(): boolean {
    return !!(
      this.selectedCreateStage &&
      this.createPhone.trim() &&
      this.isValidPhone(this.createPhone)
    );
  }

  submitCreate(): void {
    if (!this.isCreateFormValid() || !this.entityId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please select a stage and enter a valid phone number',
        life: 4000,
      });
      return;
    }

    const payload: StageContactPayload = {
      stageId: this.selectedCreateStage!.stageId,
      phoneNumber: this.normalizePhone(this.createPhone.trim()),
      entityId: this.entityId,
    };

    this.submittingCreate = true;

    this.dataService
      .post<{ status: number; message: string }>(
        API_ENDPOINTS.CREATE_PARCEL_STAGE_CONTACT,
        payload,
        'create-stage-contact'
      )
      .subscribe({
        next: (response) => {
          this.submittingCreate = false;
          if (response.status === 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'Contact Created',
              detail: response.message || 'Stage contact added successfully',
              life: 4000,
            });
            this.closeCreateDialog();
            this.refresh();
            this.fetchAllStages(); // update dropdown
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.message,
              life: 4000,
            });
          }
        },
        error: (err) => {
          this.submittingCreate = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Failed to create contact',
            detail: err?.error?.message || 'Please try again',
            life: 4000,
          });
        },
      });
  }

  // ── EDIT ──────────────────────────────────────────────────────────────────

  openEditDialog(contact: StageContact): void {
    this.selectedContact = contact;
    this.editPhone = contact.phoneNumber;
    this.showEditDialog = true;
  }

  closeEditDialog(): void {
    this.showEditDialog = false;
    this.selectedContact = null;
    this.editPhone = '';
  }

  isEditFormValid(): boolean {
    return !!(this.editPhone.trim() && this.isValidPhone(this.editPhone));
  }

  submitEdit(): void {
    if (!this.isEditFormValid() || !this.selectedContact) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please enter a valid phone number',
        life: 4000,
      });
      return;
    }

    const payload: UpdateStageContactPayload = {
      phoneNumber: this.normalizePhone(this.editPhone.trim()),
    };

    this.submittingEdit = true;

    const url = `${API_ENDPOINTS.UPDATE_PARCEL_STAGE_CONTACT}/${this.selectedContact.stageId}`;

    this.dataService
      .post<{ status: number; message: string }>(url, payload, 'update-stage-contact')
      .subscribe({
        next: (response) => {
          this.submittingEdit = false;
          if (response.status === 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'Contact Updated',
              detail: response.message || 'Phone number updated successfully',
              life: 4000,
            });
            this.closeEditDialog();
            this.refresh();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.message,
              life: 4000,
            });
          }
        },
        error: (err) => {
          this.submittingEdit = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Failed to update contact',
            detail: err?.error?.message || 'Please try again',
            life: 4000,
          });
        },
      });
  }

  // ── DELETE ────────────────────────────────────────────────────────────────

  confirmDelete(contact: StageContact): void {
    this.confirmationService.confirm({
      message: `Remove the contact for <strong>${contact.stageName}</strong>? This action cannot be undone.`,
      header: 'Delete Contact',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteContact(contact),
    });
  }

  private deleteContact(contact: StageContact): void {
    this.deletingId = contact.stageId;

    const url = `${API_ENDPOINTS.DELETE_PARCEL_STAGE_CONTACT}/${contact.stageId}`;

    this.dataService
      .delete<{ status: number; message: string }>(url, 'delete-stage-contact')
      .subscribe({
        next: (response) => {
          this.deletingId = null;
          if (response.status === 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'Contact Deleted',
              detail: response.message || `Contact for ${contact.stageName} removed`,
              life: 4000,
            });
            this.refresh();
            this.fetchAllStages(); // freed stage returns to dropdown
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.message,
              life: 4000,
            });
          }
        },
        error: (err) => {
          this.deletingId = null;
          this.messageService.add({
            severity: 'error',
            summary: 'Failed to delete contact',
            detail: err?.error?.message || 'Please try again',
            life: 4000,
          });
        },
      });
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────

  isValidPhone(phone: string): boolean {
    const local = /^0[17]\d{8}$/;
    const intl = /^254\d{9}$/;
    return local.test(phone) || intl.test(phone);
  }

  normalizePhone(phone: string): string {
    return phone.startsWith('0') ? '254' + phone.substring(1) : phone;
  }

  formatDisplayPhone(phone: string): string {
    // Convert 254XXXXXXXXX → 0XXXXXXXXX for display
    if (phone.startsWith('254') && phone.length === 12) {
      return '0' + phone.substring(3);
    }
    return phone;
  }
}