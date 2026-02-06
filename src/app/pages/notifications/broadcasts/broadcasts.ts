import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { AuthService } from '../../../../@core/services/auth.service';


interface Agent {
  value: string;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-broadcast',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    FormsModule,
  ],
  providers: [MessageService],
  templateUrl: './broadcasts.html',
  styleUrls: ['./broadcasts.css', '../../../../styles/global/_toast.css'],
})
export class BroadcastComponent2 implements OnInit {
  broadcastForm!: FormGroup;
  entityId: string = '';

  // Using signals for reactive state management
  submitted = signal(false);
  characterCount = signal(0);
  titleCharacterCount = signal(0);
  selectedAgentValue = signal('DASHMASTER');

  // Agent options with icons and colors
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

  // Computed signal for selected agent
  selectedAgent = computed(() => {
    return this.agents.find(a => a.value === this.selectedAgentValue());
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
      title: ['', [Validators.required, Validators.maxLength(100)]],
      message: ['', [Validators.required, Validators.maxLength(1000)]]
    });

    // Subscribe to agent changes to update signal
    this.broadcastForm.get('agent')?.valueChanges.subscribe(value => {
      this.selectedAgentValue.set(value);
    });

    // Subscribe to value changes for character counting
    this.broadcastForm.get('title')?.valueChanges.subscribe(() => {
      this.updateCharacterCount();
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
    this.titleCharacterCount.set(this.broadcastForm.get('title')?.value?.length || 0);
  }

  onSubmit(): void {
    this.submitted.set(true);

    // Validate form
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

    this.loadingStore.start();

    const formValue = this.broadcastForm.value;
    const request: BroadcastRequest = {
      entityId: this.entityId,
      agent: formValue.agent,
      message: formValue.message.trim(),
      title: formValue.title.trim()
    };

    // Using DataService for consistent API calls
    this.dataService
      .post<BroadcastResponse>(API_ENDPOINTS.SEND_NOTIFICATIONS, request, 'broadcast', false)
      .subscribe({
        next: (response) => {
          console.log('Broadcast sent successfully', response);
          this.loadingStore.stop();

          if (response.status === 0) {
            const agentLabel = this.selectedAgent()?.label || formValue.agent;

            this.messageService.add({
              severity: 'success',
              summary: 'Broadcast Sent Successfully',
              detail: `${response.message} - Reached ${response.totalRecords} ${agentLabel} recipients`,
              life: 5000
            });

            this.resetForm();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Broadcast Failed',
              detail: response.message || 'Failed to send broadcast. Please try again.',
              life: 5000
            });
          }
        },
        error: (error) => {
          console.error('Broadcast failed', error);
          this.loadingStore.stop();

          const errorMsg =
            error?.error?.message ||
            error?.message ||
            error?.error?.error?.message ||
            'Failed to send broadcast. Please try again.';

          this.messageService.add({
            severity: 'error',
            summary: 'Broadcast Failed',
            detail: errorMsg,
            life: 5000
          });
        }
      });
  }

  resetForm(): void {
    this.broadcastForm.reset({
      agent: 'DASHMASTER',
      title: '',
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
      title: 'Title',
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
