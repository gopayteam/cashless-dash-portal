// pages/missed-transaction/missed-transaction.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface MissedTransactionPayload {
  TransactionType: string;
  TransID: string;
  TransTime: string;
  TransAmount: string;
  BusinessShortCode: string;
  BillRefNumber: string;
  InvoiceNumber: string;
  OrgAccountBalance: string;
  ThirdPartyTransID: string;
  MSISDN: string;
  FirstName: string;
}

interface MissedTransactionResponse {
  data?: {
    message: string;
    status: string;
    success: boolean;
  };
  message?: string;
  code?: number;
}

@Component({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    MessageModule,
    ToastModule,
    ProgressSpinnerModule,
    DialogModule,
  ],
  standalone: true,
  selector: 'app-missed-transaction',
  templateUrl: './missed-transactions.html',
  styleUrls: [
    './missed-transactions.css',
    '../../../../styles/global/_toast.css'
  ],
})
export class MissedTransactionComponent implements OnInit {
  entityId: string | null = null;
  username: string | null = null;
  missedTransactionForm!: FormGroup;
  submitted = false;
  useCustomTime = false;
  showOptionalFields = false;

  // Confirmation dialog state
  showConfirmDialog = false;
  confirmationLoading = false;
  builtPayload: MissedTransactionPayload | null = null;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  /** Returns current datetime in the format required by datetime-local max attribute */
  get maxDatetimeLocal(): string {
    return this.formatTransTime(new Date()).replace(
      /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
      '$1-$2-$3T$4:$5:$6'
    );
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId;
      this.username = user.username;
    } else {
      this.router.navigate(['/login']);
      return;
    }

    this.initForm();
  }

  initForm(): void {
    this.missedTransactionForm = this.fb.group({
      TransID: [null, [Validators.required, Validators.minLength(3)]],
      TransAmount: [null, [Validators.required, Validators.min(0.01)]],
      BusinessShortCode: [null, [Validators.required, Validators.minLength(4)]],
      customTransTime: [null],
      // Optional fields — always present in the form, default to empty string
      BillRefNumber: [''],
      InvoiceNumber: [''],
      ThirdPartyTransID: [''],
    });
  }

  /**
   * Formats a Date object into the API-expected format: YYYYMMDDHHmmss
   */
  formatTransTime(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Parses the datetime-local input string value (YYYY-MM-DDTHH:mm:ss)
   * into the API format YYYYMMDDHHmmss — no Date object needed,
   * avoiding any timezone offset issues.
   */
  formatDatetimeLocalValue(value: string): string {
    // value is like "2025-04-10T21:04:25"
    return value.replace(/[-:T]/g, '').slice(0, 14);
  }

  /**
   * Builds a human-readable date string for display in the confirmation dialog
   */
  formatDisplayTime(transTime: string): string {
    if (transTime.length !== 14) return transTime;
    const year = transTime.slice(0, 4);
    const month = transTime.slice(4, 6);
    const day = transTime.slice(6, 8);
    const hour = transTime.slice(8, 10);
    const min = transTime.slice(10, 12);
    const sec = transTime.slice(12, 14);
    return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
  }

  toggleCustomTime(): void {
    this.useCustomTime = !this.useCustomTime;
    const control = this.missedTransactionForm.get('customTransTime');
    if (this.useCustomTime) {
      control?.setValidators([Validators.required]);
    } else {
      control?.clearValidators();
      control?.reset();
    }
    control?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  toggleOptionalFields(): void {
    this.showOptionalFields = !this.showOptionalFields;

    // When hiding, clear values so they go back to empty strings in the payload
    if (!this.showOptionalFields) {
      this.missedTransactionForm.patchValue({
        BillRefNumber: '',
        InvoiceNumber: '',
        ThirdPartyTransID: '',
      });
    }
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.missedTransactionForm.invalid) {
      this.markFormGroupTouched(this.missedTransactionForm);
      return;
    }

    this.prepareAndShowConfirmation();
  }

  prepareAndShowConfirmation(): void {
    const formValue = this.missedTransactionForm.value;

    // Determine transaction time
    let transTime: string;
    if (this.useCustomTime && formValue.customTransTime) {
      // datetime-local gives us "YYYY-MM-DDTHH:mm:ss" — strip separators directly
      transTime = this.formatDatetimeLocalValue(formValue.customTransTime);
    } else {
      transTime = this.formatTransTime(new Date());
    }

    this.builtPayload = {
      TransactionType: 'Customer Merchant Payment',
      TransID: formValue.TransID.trim().toUpperCase(),
      TransTime: transTime,
      TransAmount: Number(formValue.TransAmount).toFixed(2),
      BusinessShortCode: String(formValue.BusinessShortCode).trim(),
      BillRefNumber: formValue.BillRefNumber?.trim() || '',
      InvoiceNumber: formValue.InvoiceNumber?.trim() || '',
      OrgAccountBalance: '00',
      ThirdPartyTransID: formValue.ThirdPartyTransID?.trim() || '',
      MSISDN: '657b7a747ba9',
      FirstName: 'MISSED TRANS',
    };

    this.showConfirmDialog = true;
  }

  confirmSubmission(): void {
    if (!this.builtPayload) return;

    this.confirmationLoading = true;

    console.log('Submitting missed transaction payload:', this.builtPayload);

    this.dataService
      .post<MissedTransactionResponse>(API_ENDPOINTS.MISSED_TRANSACTION, this.builtPayload, 'missedTransaction', true)
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'info',
            summary: 'Transaction Submitted',
            detail: 'Missed transaction submitted successfully!',
            life: 4000,
          });

          this.confirmationLoading = false;
          this.showConfirmDialog = false;

          if (response == null) {
            this.resetForm();
            return
          }

          if (response.code === 0 || response.data?.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Transaction Submitted',
              detail: response.data?.message || 'Missed transaction submitted successfully!',
              life: 4000,
            });
            this.resetForm();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Submission Failed',
              detail: response.message || 'Failed to submit missed transaction.',
              life: 4000,
            });
          }
        },
        error: (err) => {
          console.error('Failed to submit missed transaction', err);
          this.confirmationLoading = false;
          this.showConfirmDialog = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.message || 'An error occurred. Please try again.',
            life: 4000,
          });
        },
        complete: () => {
          console.log("Done")
        },
      });
  }

  rejectSubmission(): void {
    this.showConfirmDialog = false;
    this.builtPayload = null;
    this.messageService.add({
      severity: 'info',
      summary: 'Cancelled',
      detail: 'Transaction submission cancelled.',
      life: 2500,
    });
  }

  resetForm(): void {
    this.submitted = false;
    this.useCustomTime = false;
    this.showOptionalFields = false;
    this.missedTransactionForm.reset({
      BillRefNumber: '',
      InvoiceNumber: '',
      ThirdPartyTransID: '',
    });
    const control = this.missedTransactionForm.get('customTransTime');
    control?.clearValidators();
    control?.updateValueAndValidity();
    this.showConfirmDialog = false;
    this.builtPayload = null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.missedTransactionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.missedTransactionForm.get(fieldName);

    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} must be greater than 0`;
    }
    if (field?.hasError('minlength')) {
      const minLen = field.errors?.['minlength']?.requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLen} characters`;
    }

    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      TransID: 'Transaction ID',
      TransAmount: 'Transaction Amount',
      BusinessShortCode: 'Business Short Code',
      customTransTime: 'Transaction Time',
      BillRefNumber: 'Bill Reference Number',
      InvoiceNumber: 'Invoice Number',
      ThirdPartyTransID: 'Third Party Transaction ID',
    };
    return labels[fieldName] || fieldName;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}