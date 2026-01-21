// pages/fund-reassignment/fund-reassignment.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';

interface Vehicle {
  fleetNumber: string;
  // Add other vehicle properties as needed
  vehicleType?: string;
  registrationNumber?: string;
}

interface VehicleOption {
  fleetNumber: string;
  label: string;
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
    ProgressSpinnerModule,
  ],
  standalone: true,
  selector: 'app-fund-reassignment',
  templateUrl: './fund-reassignment.html',
  styleUrls: [
    './fund-reassignment.css',
  ],
})
export class FundReassignmentComponent implements OnInit {
  entityId: string | null = null;
  fundReassignmentForm!: FormGroup;
  vehicles: Vehicle[] = [];
  sourceFleetOptions: VehicleOption[] = [];
  destinationFleetOptions: VehicleOption[] = [];
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
     const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId
      // console.log('Logged in as:', user.username);
    } else {
      this.router.navigate(['/login']);
      console.log('No user logged in');
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

    // TODO: Replace with actual API endpoint for vehicles
    // Example: API_ENDPOINTS.VEHICLES or API_ENDPOINTS.ALL_VEHICLES
    this.dataService
      .post<any>(API_ENDPOINTS.ALL_VEHICLES, payload, 'vehicles')
      .subscribe({
        next: (response) => {
          // Adjust based on your actual API response structure
          // Assuming response has a data.manifest or similar structure
          this.vehicles = response.data?.manifest || response.data || response;

          this.sourceFleetOptions = this.vehicles.map(v => ({
            fleetNumber: v.fleetNumber,
            label: `${v.fleetNumber} - ${v.registrationNumber}`,
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
            { fleetNumber: 'FL001' },
            { fleetNumber: 'FL002' },
            { fleetNumber: 'FL003' },
            { fleetNumber: 'FL004' },
            { fleetNumber: 'FL005' },
          ];

          this.sourceFleetOptions = this.vehicles.map(v => ({
            fleetNumber: v.fleetNumber,
            label: `Fleet ${v.fleetNumber}`,
          }));

          this.destinationFleetOptions = [...this.sourceFleetOptions];
          this.cdr.detectChanges();
        },
      });
  }

  updateDestinationOptions(sourceFleet: string | null): void {
    if (!sourceFleet) {
      // If no source selected, show all options
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

    this.loadingStore.start();

    const payload = {
      sourceFleetNumber: formValue.sourceFleetNumber,
      destinationFleetNumber: formValue.destinationFleetNumber,
      amount: formValue.amount,
      entityId: this.entityId,
    };

    // TODO: Replace with actual API endpoint for fund reassignment
    console.log('Submitting fund reassignment:', payload);

    /*
    this.dataService.post(API_ENDPOINTS.FUND_REASSIGNMENT, payload, 'reassignment').subscribe({
      next: (response) => {
        console.log('Fund reassignment successful', response);
        this.resetForm();
        this.loadingStore.stop();
        // Show success message
      },
      error: (err) => {
        console.error('Failed to reassign funds', err);
        this.loadingStore.stop();
        // Show error message
      },
    });
    */

    // Simulate API call
    setTimeout(() => {
      this.loadingStore.stop();
      this.resetForm();
      console.log('Fund reassignment submitted successfully');
    }, 1500);
  }

  resetForm(): void {
    this.submitted = false;
    this.fundReassignmentForm.reset();
    this.destinationFleetOptions = [...this.sourceFleetOptions];
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
