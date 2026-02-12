// pages/fund-reassignment/fund-reassignment.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface Vehicle {
  fleetNumber: string;
  vehicleType?: string;
  registrationNumber?: string;
}

interface VehicleOption {
  fleetNumber: string;
  label: string;
}

interface InitiateReassignmentResponse {
  data: {
    message: string;
    status: string;
    refId: string;
    category: string;
    success: boolean;
  };
  message: string;
  code: number;
}

interface ConfirmReassignmentResponse {
  data: null;
  message: string;
  code: number;
}

@Component({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    MessageModule,
    ToastModule,
    ProgressSpinnerModule,
    DialogModule,
  ],
  standalone: true,
  selector: 'app-fund-reassignment',
  templateUrl: './fund-reassignment.html',
  styleUrls: [
    './fund-reassignment.css',
    '../../../../styles/global/_toast.css'
  ],
})
export class FundReassignmentComponent implements OnInit {
  entityId: string | null = null;
  walletEntityId: string | null = null;
  username: string | null = null;
  fundReassignmentForm!: FormGroup;
  vehicles: Vehicle[] = [];
  sourceFleetOptions: VehicleOption[] = [];
  destinationFleetOptions: VehicleOption[] = [];
  submitted = false;

  // Confirmation dialog state
  showConfirmDialog = false;
  confirmationLoading = false;
  initiateResponse: InitiateReassignmentResponse | null = null;

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

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId;
      this.walletEntityId = user.entityId; // Assuming walletEntityId is same as entityId
      this.username = user.username;
    } else {
      this.router.navigate(['/login']);
      console.log('No user logged in');
      return;
    }

    this.initForm();
    this.loadVehicles();
  }

  initForm(): void {
    this.fundReassignmentForm = this.fb.group({
      sourceFleetNumber: [null, Validators.required],
      destinationFleetNumber: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
    });

    // Watch for source fleet changes to filter destination options
    this.fundReassignmentForm.get('sourceFleetNumber')?.valueChanges.subscribe((sourceFleet) => {
      this.updateDestinationOptions(sourceFleet);
    });
  }

  loadVehicles(): void {
    this.loadingStore.start();

    const payload = {
      entityId: this.entityId,
      page: 0,
      size: 10000,
    };

    this.dataService
      .post<any>(API_ENDPOINTS.ALL_VEHICLES, payload, 'vehicles')
      .subscribe({
        next: (response) => {
          this.vehicles = response.data?.manifest || response.data || response;

          this.sourceFleetOptions = this.vehicles.map(v => ({
            fleetNumber: v.fleetNumber,
            label: `${v.fleetNumber}${v.registrationNumber ? ' - ' + v.registrationNumber : ''}`,
          }));

          this.destinationFleetOptions = [...this.sourceFleetOptions];

          this.loadingStore.stop();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load vehicles', err);
          this.loadingStore.stop();

          // Fallback mock data for development
          this.vehicles = [
            { fleetNumber: 'FL001', registrationNumber: 'KAA 001A' },
            { fleetNumber: 'FL002', registrationNumber: 'KAA 002B' },
            { fleetNumber: 'FL003', registrationNumber: 'KAA 003C' },
            { fleetNumber: 'FL004', registrationNumber: 'KAA 004D' },
            { fleetNumber: 'FL005', registrationNumber: 'KAA 005E' },
          ];

          this.sourceFleetOptions = this.vehicles.map(v => ({
            fleetNumber: v.fleetNumber,
            label: `${v.fleetNumber}${v.registrationNumber ? ' - ' + v.registrationNumber : ''}`,
          }));

          this.destinationFleetOptions = [...this.sourceFleetOptions];
          this.cdr.detectChanges();
        },
      });
  }

  updateDestinationOptions(sourceFleet: string | null): void {
    if (!sourceFleet) {
      this.destinationFleetOptions = [...this.sourceFleetOptions];
      return;
    }

    // Filter out the source fleet from destination options
    this.destinationFleetOptions = this.sourceFleetOptions.filter(
      option => option.fleetNumber !== sourceFleet
    );

    // Reset destination if it matches source
    const currentDestination = this.fundReassignmentForm.get('destinationFleetNumber')?.value;
    if (currentDestination === sourceFleet) {
      this.fundReassignmentForm.patchValue({ destinationFleetNumber: null });
    }
  }

  onSubmit(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Feature disabled. contact support',
      life: 4000
    });
  }

  onSubmit22(): void {
    this.submitted = true;

    if (this.fundReassignmentForm.invalid) {
      this.markFormGroupTouched(this.fundReassignmentForm);
      return;
    }

    // Additional validation: ensure source and destination are different
    const formValue = this.fundReassignmentForm.value;
    if (formValue.sourceFleetNumber === formValue.destinationFleetNumber) {
      console.error('Source and destination fleet numbers must be different');
      return;
    }

    this.initiateReassignment();
  }

  initiateReassignment(): void {
    this.loadingStore.start();

    const formValue = this.fundReassignmentForm.value;

    const payload = {
      paymentType: 'FARE',
      paymentSource: 'WALLET',
      amount: formValue.amount,
      username: this.username,
      phoneNumber: this.username, // Using username as phoneNumber as per your example
      fleetNumber: formValue.sourceFleetNumber,
      saccoEntityId: this.entityId,
      walletEntityId: this.walletEntityId,
    };

    console.log('Initiating fund reassignment:', payload);

    this.dataService
      .post<InitiateReassignmentResponse>(API_ENDPOINTS.INITIATE_REASSIGNMENT, payload, 'reassignment')
      .subscribe({
        next: (response) => {
          console.log('Initiate reassignment response:', response);
          this.loadingStore.stop();

          if (response.data?.success) {
            this.initiateResponse = response;
            this.showConfirmDialog = true;
          } else {
            console.error('Initiate reassignment failed:', response);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.message || 'failed to Initiate funds reassignment ',
              life: 4000
            });
            alert('Failed to initiate reassignment: ' + (response.data?.message || 'Unknown error'));
          }
        },
        error: (err) => {
          console.error('Failed to initiate reassignment', err);
          this.loadingStore.stop();
          // You can add toast notification here
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.message || 'Failed to initiate reassignment',
            life: 4000
          });
          alert('Error initiating reassignment. Please try again.');
        },
      });
  }

  confirmReassignment(): void {
    if (!this.initiateResponse) {
      console.error('No initiate response available');
      return;
    }

    this.confirmationLoading = true;

    const formValue = this.fundReassignmentForm.value;

    const payload = {
      amount: formValue.amount,
      destinationFleetNumber: formValue.destinationFleetNumber,
      sourceFleetNumber: formValue.sourceFleetNumber,
      saccoEntityId: this.entityId,
      walletEntityId: this.walletEntityId,
      phoneNumber: this.username,
      paymentSource: 'WALLET',
      paymentType: 'FARE',
      mpesaId: this.initiateResponse.data.refId,
      category: this.initiateResponse.data.category,
    };

    console.log('Confirming fund reassignment:', payload);

    this.dataService
      .post<ConfirmReassignmentResponse>(API_ENDPOINTS.CONFIRM_REASSIGNMENT, payload, 'confirmation')
      .subscribe({
        next: (response) => {
          console.log('Confirm reassignment response:', response);
          this.confirmationLoading = false;
          this.showConfirmDialog = false;

          if (response.code === 0) {
            // Success
            this.messageService.add({
              severity: 'success',
              summary: 'Transfer successful',
              detail: `Fund reassignment completed successfully!`,
              life: 3000
            });
            alert('Fund reassignment completed successfully!');
            this.resetForm();
            this.initiateResponse = null;
          } else {
            console.error('Confirm reassignment failed:', response);
            alert('Failed to confirm reassignment: ' + (response.message || 'Unknown error'));
          }
        },
        error: (err) => {
          console.error('Failed to confirm reassignment', err);
          this.confirmationLoading = false;
          this.showConfirmDialog = false;
          alert('Error confirming reassignment. Please try again.');
        },
      });
  }

  rejectReassignment(): void {
    this.showConfirmDialog = false;
    this.initiateResponse = null;
    console.log('Reassignment rejected by user');
    // Optionally show a toast notification
  }

  resetForm(): void {
    this.submitted = false;
    this.fundReassignmentForm.reset();
    this.destinationFleetOptions = [...this.sourceFleetOptions];
    this.showConfirmDialog = false;
    this.initiateResponse = null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.fundReassignmentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.fundReassignmentForm.get(fieldName);

    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (field?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} must be greater than 0`;
    }

    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      sourceFleetNumber: 'Source Fleet Number',
      destinationFleetNumber: 'Destination Fleet Number',
      amount: 'Amount',
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
