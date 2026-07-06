import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';

interface Agent {
  value: string;
  label: string;
  icon: string;
  color: string;
}

interface SmsBroadcastRequest {
  entityId: string;
  agent: string;
  message: string;
}

interface SmsBroadcastResponse {
  status: number;
  message: string;
  totalRecords: number;
}

// GSM-7 single-segment limit is 160 chars; multipart segments are 153 chars each.
const SMS_SEGMENT_LIMIT = 160;
const SMS_MULTIPART_SEGMENT_LIMIT = 153;
const SMS_MAX_LENGTH = 918; // 6 segments cap, adjust as needed

@Component({
  selector: 'app-sms-broadcast',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './sms-broadcast.html',
  styleUrls: ['./sms-broadcast.css', '../../../../styles/global/_toast.css'],
})
export class SmsBroadcastComponent implements OnInit {
  broadcastForm!: FormGroup;
  entityId: string = '';

  submitted = signal(false);
  characterCount = signal(0);
  selectedAgentValue = signal('DASHMASTER');
  showConfirmDialog = signal(false);

  readonly agents: Agent[] = [
    { value: 'DASHMASTER', label: 'Dashmaster', icon: '🎯', color: '#FF6B6B' },
    { value: 'APPROVER', label: 'Approver', icon: '✓', color: '#4ECDC4' },
    { value: 'INSPECTOR', label: 'Inspector', icon: '🔍', color: '#45B7D1' },
    { value: 'DRIVER', label: 'Driver', icon: '🚗', color: '#FFA07A' },
    { value: 'PARCEL', label: 'Parcel', icon: '📦', color: '#98D8C8' },
    { value: 'PASSENGER', label: 'Passenger', icon: '👤', color: '#A8E6CF' },
    { value: 'MARSHAL', label: 'Marshal', icon: '⚡', color: '#FFD93D' },
    { value: 'ADMIN', label: 'Admin', icon: '👑', color: '#C77DFF' },
    { value: 'CONDUCTOR', label: 'Conductor', icon: '🎫', color: '#6BCB77' },
    { value: 'INVESTOR', label: 'Investor', icon: '💼', color: '#4D96FF' }
  ];

  selectedAgent = computed(() => {
    return this.agents.find(a => a.value === this.selectedAgentValue());
  });

  // Number of SMS segments the current message will be billed as
  segmentCount = computed(() => {
    const len = this.characterCount();
    if (len === 0) return 0;
    if (len <= SMS_SEGMENT_LIMIT) return 1;
    return Math.ceil(len / SMS_MULTIPART_SEGMENT_LIMIT);
  });

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private authService: AuthService,
    private router: Router,
    public loadingStore: LoadingStore,
    private messageService: MessageService
  ) { }

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

    this.initForm();
  }

  initForm(): void {
    this.broadcastForm = this.fb.group({
      agent: ['DASHMASTER', [Validators.required]],
      message: ['', [Validators.required, Validators.maxLength(SMS_MAX_LENGTH)]]
    });

    this.broadcastForm.get('agent')?.valueChanges.subscribe(value => {
      this.selectedAgentValue.set(value);
    });

    this.broadcastForm.get('message')?.valueChanges.subscribe(() => {
      this.updateCharacterCount();
    });

    this.updateCharacterCount();
  }

  selectAgent(agentValue: string): void {
    if (!this.loading()) {
      this.broadcastForm.patchValue({ agent: agentValue });
      this.selectedAgentValue.set(agentValue);
    }
  }

  updateCharacterCount(): void {
    this.characterCount.set(this.broadcastForm.get('message')?.value?.length || 0);
  }

  // Step 1: validate, then open the charge-warning confirmation modal instead of sending directly
  onSubmit(): void {
    this.submitted.set(true);

    if (this.broadcastForm.invalid) {
      this.markFormGroupTouched(this.broadcastForm);

      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly',
        life: 4000
      });
      return;
    }

    this.showConfirmDialog.set(true);
  }

  cancelSend(): void {
    this.showConfirmDialog.set(false);
  }

  // Step 2: user confirmed in the modal, actually send the SMS
  confirmSend(): void {
    this.showConfirmDialog.set(false);
    this.loadingStore.start();

    const formValue = this.broadcastForm.value;
    const request: SmsBroadcastRequest = {
      entityId: this.entityId,
      agent: formValue.agent,
      message: formValue.message.trim()
    };

    this.dataService
      .post<SmsBroadcastResponse>(API_ENDPOINTS.SEND_SMS_NOTIFICATIONS, request, 'sms-broadcast', false)
      .subscribe({
        next: (response) => {
          console.log('SMS broadcast sent successfully', response);
          this.loadingStore.stop();

          if (response.status === 0) {
            const agentLabel = this.selectedAgent()?.label || formValue.agent;

            this.messageService.add({
              severity: 'success',
              summary: 'SMS Broadcast Sent Successfully',
              detail: `${response.message} - Reached ${response.totalRecords} ${agentLabel} recipients`,
              life: 5000
            });

            this.resetForm();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'SMS Broadcast Failed',
              detail: response.message || 'Failed to send SMS broadcast. Please try again.',
              life: 5000
            });
          }
        },
        error: (error) => {
          console.error('SMS broadcast failed', error);
          this.loadingStore.stop();

          const errorMsg =
            error?.error?.message ||
            error?.message ||
            error?.error?.error?.message ||
            'Failed to send SMS broadcast. Please try again.';

          this.messageService.add({
            severity: 'error',
            summary: 'SMS Broadcast Failed',
            detail: errorMsg,
            life: 5000
          });
        }
      });
  }

  resetForm(): void {
    this.broadcastForm.reset({
      agent: 'DASHMASTER',
      message: ''
    });
    this.submitted.set(false);
    this.selectedAgentValue.set('DASHMASTER');
    this.updateCharacterCount();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.broadcastForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted()));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.broadcastForm.get(fieldName);

    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must not exceed ${maxLength} characters`;
    }

    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      agent: 'Agent',
      message: 'Message'
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
