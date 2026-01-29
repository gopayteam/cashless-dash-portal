// pages/parcel-users/add-parcel-user/add-parcel-user.component.ts
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
import { DataService } from '../../../../../@core/api/data.service';
import { LoadingStore } from '../../../../../@core/state/loading.store';
import { AuthService } from '../../../../../@core/services/auth.service';
import { API_ENDPOINTS } from '../../../../../@core/api/endpoints';
import { ParcelDetailsApiResponse } from '../../../../../@core/models/parcels/parcel_stage_response';
import { ToastModule } from "primeng/toast";
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { Stage } from '../../../../../@core/models/locations/stage.model';

interface DropdownOption {
  label: string;
  value: any;
}

interface ParcelUserPayload {
  entityId: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  profile: string;
  channel: string;
  agent: string;
  stageId: number;
  deviceId: string;
}

interface ApiResponse {
  status: number;
  message: string;
  data: any[];
  totalRecords: number;
}

@Component({
  selector: 'app-add-parcel-user',
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
  templateUrl: './register-parcel-manager.html',
  styleUrls: ['./register-parcel-manager.css', '../../../../../styles/global/_toast.css'],
})
export class RegisterParcelManagerComponent implements OnInit {
  entityId: string | null = null;

  // Form fields
  phoneNumber: string = '';
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  selectedStage: number | null = null;
  deviceId: string = '';

  // Constants
  readonly PROFILE = 'PARCEL';
  readonly CHANNEL = 'PORTAL';
  readonly AGENT = 'PARCEL';

  // Dropdown options
  stageOptions: DropdownOption[] = [];

  // Loading states
  stagesLoading: boolean = false;
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

    this.loadStages();
  }

  loadStages(): void {
    if (!this.entityId) return;

    this.stagesLoading = true;

    const params = {
      entityId: this.entityId,
      page: 0,
      size: 100,
      startDate: null,
      endDate: null,
    };

    // Fetch both source and destination stages in parallel
    this.dataService
      .get<ParcelDetailsApiResponse>(API_ENDPOINTS.ALL_PARCEL_STAGES, params, 'all-parcel-stages').subscribe({
        next: (response) => {
          this.stageOptions = response.data.map((stage: Stage) => ({
            label: `${stage.name} (${stage.id || 'N/A'})`,
            value: stage.id,
          }));

          this.stagesLoading = false;
        },
        error: (err) => {
          console.error('Failed to load parcel stages', err);

          this.stagesLoading = false;
        },
      });
  }

  isFormValid(): boolean {
    return !!(
      this.phoneNumber.trim() &&
      this.firstName.trim() &&
      this.lastName.trim() &&
      this.email.trim() &&
      this.isValidEmail(this.email) &&
      this.selectedStage &&
      this.deviceId.trim()
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhoneNumber(phone: string): boolean {
    // Basic validation for phone number (adjust based on your requirements)
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone);
  }

  onSubmit(): void {
    if (!this.isFormValid() || !this.entityId) {
      return;
    }

    if (!this.isValidPhoneNumber(this.phoneNumber)) {
      console.error('Invalid phone number format');
      return;
    }

    const payload: ParcelUserPayload = {
      entityId: this.entityId,
      phoneNumber: this.phoneNumber.trim(),
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim().toLowerCase(),
      profile: this.PROFILE,
      channel: this.CHANNEL,
      agent: this.AGENT,
      stageId: this.selectedStage!,
      deviceId: this.deviceId.trim(),
    };

    this.submitting = true;
    this.loadingStore.start();

    this.dataService
      .post<ApiResponse>(API_ENDPOINTS.REGISTER, payload, 'register-parcel-user')
      .subscribe({
        next: (response) => {
          console.log('Parcel user created successfully', response);
          this.submitting = false;
          this.loadingStore.stop();
          this.messageService.add({
            severity: 'success',
            summary: 'created  successfully',
            detail: 'Parcel user created successfully',
            life: 4000
          });
          // Navigate to parcel users list page
          this.router.navigate(['users/parcel-managers']);
        },
        error: (err) => {
          console.error('Failed to update parcel manager - Full error:', err);
          console.error('Error status:', err.status);
          console.error('Error message:', err.error?.message);
          console.error('Error details:', err.error);

          // More detailed error message
          let errorMessage = 'Failed to update parcel manager';

          if (err.status === 500) {
            errorMessage = 'Server error occurred. Please check if all required fields are correct.';
          } else if (err.status === 400) {
            errorMessage = err.error?.message || 'Invalid data provided. Please check your inputs.';
          } else if (err.status === 404) {
            errorMessage = 'User or endpoint not found.';
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else {
            errorMessage =
              err?.error?.message ||
              err?.error?.error ||
              err?.message ||
              'Unknown server error';
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error Occurred',
            detail: errorMessage,
            life: 4000
          });
          this.submitting = false;
          this.loadingStore.stop();
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['users/parcel-managers']);
  }

  resetForm(): void {
    this.phoneNumber = '';
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.selectedStage = null;
    this.deviceId = '';
  }
}
