// pages/users/create-user/create-user.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DataService } from '../../../../../@core/api/data.service';
import { LoadingStore } from '../../../../../@core/state/loading.store';
import { AuthService } from '../../../../../@core/services/auth.service';
import { API_ENDPOINTS } from '../../../../../@core/api/endpoints';

interface DropdownOption {
  label: string;
  value: string;
}

interface CreateUserPayload {
  agent: string;
  channel: string;
  email: string;
  entityId: string;
  firstName: string;
  idNumber: string;
  lastName: string;
  phoneNumber: string;
  profile: string;
}

interface ApiResponse {
  status: number;
  message: string;
  data: any;
}

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ProgressSpinnerModule,
    TooltipModule,
    MessageModule,
    ToastModule,
  ],
  templateUrl: './register-user.html',
  styleUrls: ['./register-user.css',],
  providers: [MessageService]
})
export class RegisterUserComponent implements OnInit {
  entityId: string | null = null;

  readonly CHANNEL = 'PORTAL';

  // Form fields
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  phoneNumber: string = '';
  idNumber: string = '';
  selectedProfile: string = '';
  selectedAgent: string = '';
  selectedChannel: string = '';

  // Dropdown options
  profileOptions: DropdownOption[] = [
    { label: 'Super Admin', value: 'SUPER_ADMIN' },
    { label: 'Dashmaster', value: 'DASHMASTER' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'User', value: 'USER' },
    { label: 'Manager', value: 'MANAGER' },
    { label: 'Parcel', value: 'PARCEL' },
    { label: 'Driver', value: 'DRIVER' },
    { label: 'Conductor', value: 'CONDUCTOR' },
  ];

  agentOptions: DropdownOption[] = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Parcel', value: 'PARCEL' },
    { label: 'Passenger', value: 'PASSENGER' },
    { label: 'Marshal', value: 'MARSHAL' },
    { label: 'Driver', value: 'DRIVER' },
    { label: 'Conductor', value: 'CONDUCTOR' },
    { label: 'Investor', value: 'INVESTOR' },
  ];

  channelOptions: DropdownOption[] = [
    { label: 'Portal', value: 'PORTAL' },
    { label: 'App', value: 'APP' },
    { label: 'Web', value: 'WEB' },
  ];

  // Loading state
  submitting: boolean = false;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
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
  }

  isFormValid(): boolean {
    return !!(
      this.firstName.trim() &&
      this.lastName.trim() &&
      this.email.trim() &&
      this.isValidEmail(this.email) &&
      this.phoneNumber.trim() &&
      this.idNumber.trim() &&
      this.selectedProfile &&
      this.selectedAgent &&
      this.selectedChannel
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhoneNumber(phone: string): boolean {
    // Accepts both formats: 254XXXXXXXXX or 07XXXXXXXX
    const phoneRegex1 = /^254\d{9}$/;
    const phoneRegex2 = /^0[17]\d{8}$/;
    return phoneRegex1.test(phone) || phoneRegex2.test(phone);
  }

  isValidIdNumber(idNumber: string): boolean {
    // Kenyan ID numbers are typically 7-8 digits
    const idRegex = /^\d{7,8}$/;
    return idRegex.test(idNumber);
  }

  normalizePhoneNumber(phone: string): string {
    // Convert 07XXXXXXXX to 254XXXXXXXXX
    if (phone.startsWith('0')) {
      return '254' + phone.substring(1);
    }
    return phone;
  }

  onSubmit(): void {
    if (!this.isFormValid() || !this.entityId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly',
        life: 4000
      });
      return;
    }

    if (!this.isValidPhoneNumber(this.phoneNumber)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Invalid phone number format. Use 254XXXXXXXXX or 07XXXXXXXX',
        life: 4000
      });
      return;
    }

    if (!this.isValidIdNumber(this.idNumber)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Invalid ID number. Must be 7-8 digits',
        life: 4000
      });
      return;
    }

    const normalizedPhone = this.normalizePhoneNumber(this.phoneNumber.trim());

    const payload: CreateUserPayload = {
      agent: this.selectedAgent,
      channel: this.selectedChannel,
      email: this.email.trim().toLowerCase(),
      entityId: this.entityId,
      firstName: this.firstName.trim(),
      idNumber: this.idNumber.trim(),
      lastName: this.lastName.trim(),
      phoneNumber: normalizedPhone,
      profile: this.selectedProfile,
    };

    console.log('Creating user with payload:', payload);

    this.submitting = true;
    this.loadingStore.start();

    this.dataService
      .post<ApiResponse>(API_ENDPOINTS.REGISTER_USER, payload, 'register-admin-user')
      .subscribe({
        next: (response) => {
          console.log('Admin created successfully', response);
          this.submitting = false;
          this.loadingStore.stop();

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message || 'Admin created successfully',
            life: 4000
          });

          // Reset form
          this.resetForm();

          // Navigate to users list after a short delay
          setTimeout(() => {
            this.router.navigate(['/users/all']);
          }, 1500);
        },
        error: (err) => {
          console.error('Failed to create user - Full error:', err);
          console.error('Error status:', err.status);
          console.error('Error details:', err.error);

          let errorMessage = 'Failed to create user';

          if (err.status === 409) {
            errorMessage = 'User with this email or phone number already exists';
          } else if (err.status === 400) {
            errorMessage = err.error?.message || 'Invalid data provided. Please check your inputs.';
          } else if (err.status === 500) {
            errorMessage = 'Server error occurred. Please try again later.';
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error Occurred',
            detail: errorMessage,
            life: 5000
          });

          this.submitting = false;
          this.loadingStore.stop();
        },
      });
  }

  resetForm(): void {
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.phoneNumber = '';
    this.idNumber = '';
    this.selectedProfile = '';
    this.selectedAgent = '';
    this.selectedChannel = '';
  }

  onCancel(): void {
    this.router.navigate(['/users/all']);
  }
}
