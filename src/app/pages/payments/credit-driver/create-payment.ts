// pages/credit-driver/credit-driver.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { UserApiResponse } from '../../../../@core/models/user/user_api_Response.mode';
import { User } from '../../../../@core/models/user/user.model';

import { Vehicle } from '../../../../@core/models/vehicle/vehicle.model';
import { VehicleApiResponse } from '../../../../@core/models/vehicle/vehicle_reponse.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';


interface FleetOption {
  fleetNumber: string;
  label: string;
}

interface DriverOption {
  driverId: string;
  label: string;
  fleetNumber?: string;
  username: string;
  phoneNumber: string;
}

@Component({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    MessageModule,
    ProgressSpinnerModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  standalone: true,
  selector: 'app-credit-driver',
  templateUrl: './create-payment.html',
  styleUrls: [
    './create-payment.css',
  ],
})
export class CreditDriverComponent implements OnInit {
  entityId: string | null = null;
  creditDriverForm!: FormGroup;
  vehicles: Vehicle[] = [];
  fleets: FleetOption[] = [];
  drivers: User[] = [];
  allDriverOptions: DriverOption[] = [];
  filteredDrivers: DriverOption[] = [];
  maxDate: Date = new Date();
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
    this.loadDrivers();
  }

  initForm(): void {
    this.creditDriverForm = this.fb.group({
      fleetNumber: [null, Validators.required],
      driverId: [null, Validators.required],
      activityDate: [null, Validators.required],
    });

    // Watch for fleet changes to filter drivers
    this.creditDriverForm.get('fleetNumber')?.valueChanges.subscribe((fleetNumber) => {
      this.onFleetChange(fleetNumber);
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
      .post<VehicleApiResponse>(API_ENDPOINTS.ALL_VEHICLES, payload, 'vehicles')
      .subscribe({
        next: (response) => {
          // Extract vehicles from the response
          this.vehicles = response.data || [];

          // Create fleet options with more detailed labels
          this.fleets = this.vehicles.map(v => ({
            fleetNumber: v.fleetNumber,
            label: `${v.fleetNumber} - ${v.registrationNumber}`,
          }));

          this.loadingStore.stop();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load vehicles', err);
          this.loadingStore.stop();

          // Fallback mock data for development
          this.fleets = [
            { fleetNumber: 'FL001', label: 'FL001 - KAA 123A' },
            { fleetNumber: 'FL002', label: 'FL002 - KAB 456B' },
            { fleetNumber: 'FL003', label: 'FL003 - KAC 789C' },
          ];

          this.cdr.detectChanges();
        },
      });
  }

  loadDrivers(): void {
    this.loadingStore.start();

    const payload = {
      agent: 'DRIVER',
      entityId: this.entityId,
      page: 0,
      size: 10000,
    };

    this.dataService
      .post<UserApiResponse>(API_ENDPOINTS.ALL_USERS, payload, 'driver-users')
      .subscribe({
        next: (response) => {
          // Extract drivers from the response
          this.drivers = response.data || [];

          // Create driver options with labels
          this.allDriverOptions = this.drivers.map(d => ({
            driverId: d.entityId,
            label: this.getDriverLabel(d),
            fleetNumber: d.phoneNumber, // Assuming username contains fleet number
            username:  d.username ? d.username : this.getDriverLabel(d),
            phoneNumber: d.phoneNumber,
          }));

          this.loadingStore.stop();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load drivers', err);
          this.loadingStore.stop();

          // Fallback mock data for development
          this.allDriverOptions = [
            {
              driverId: 'DRV001',
              label: 'DRV001 - John Doe (0712345678)',
              fleetNumber: 'FL001',
              username: 'Test user 1',
              phoneNumber: '07xxxxxxxx'
            },
            {
              driverId: 'DRV002',
              label: 'DRV002 - Jane Smith (0723456789)',
              fleetNumber: 'FL002',
              username: 'Test user 2',
              phoneNumber: '07xxxxxxxx'
            },
            {
              driverId: 'DRV003',
              label: 'DRV003 - Mike Johnson (0734567890)',
              fleetNumber: 'FL003',
              username: 'Test user 3',
              phoneNumber: '07xxxxxxxx'
            },
          ];

          this.cdr.detectChanges();
        },
      });
  }

  getDriverLabel(driver: User): string {
    // Create a comprehensive label with driver information
    const name = driver.firstName && driver.lastName
      ? `${driver.firstName} ${driver.lastName}`
      : driver.firstName || driver.username;

    const phone = driver.phoneNumber ? ` (${driver.phoneNumber})` : '';

    return `${driver.entityId} - ${name}${phone}`;
  }

  onFleetChange(fleetNumber: string): void {
    if (!fleetNumber) {
      this.filteredDrivers = [];
      this.creditDriverForm.patchValue({ driverId: null });
      return;
    }

    // Filter drivers based on selected fleet
    // Assuming driver.username contains the fleet number they're assigned to
    this.filteredDrivers = this.allDriverOptions.filter(
      driver => driver.fleetNumber === fleetNumber
    );

    // If no drivers found for this fleet, show all drivers
    if (this.filteredDrivers.length === 0) {
      this.filteredDrivers = [...this.allDriverOptions];
    }

    // Reset driver selection when fleet changes
    this.creditDriverForm.patchValue({ driverId: null });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.creditDriverForm.invalid) {
      this.markFormGroupTouched(this.creditDriverForm);
      return;
    }

    this.loadingStore.start();

    const formValue = this.creditDriverForm.value;

    // Format date to YYYY-MM-DD
    const activityDate = formValue.activityDate instanceof Date
      ? formValue.activityDate.toISOString().split('T')[0]
      : formValue.activityDate;

    const payload = {
      fleetNumber: formValue.fleetNumber,
      activeDriver: formValue.driverId,
      currentDate: activityDate,
      entityId: this.entityId,
    };

    // api/payment/wallets/assign/driver
    // activeDriver
    // : 
    // "254722157126"
    // currentDate
    // : 
    // "2026-02-03"
    // entityId
    // : 
    // "GS000002"
    // fleetNumber
    // : 
    // "SM368"

    // TODO: Replace with actual API endpoint for credit driver
    console.log('Submitting credit driver data:', payload);

    /*
    this.dataService.post(API_ENDPOINTS.CREDIT_DRIVER, payload, 'credit').subscribe({
      next: (response) => {
        console.log('Driver credited successfully', response);
        this.resetForm();
        this.loadingStore.stop();
        // Show success message
      },
      error: (err) => {
        console.error('Failed to credit driver', err);
        this.loadingStore.stop();
        // Show error message
      },
    });
    */

    // Simulate API call
    setTimeout(() => {
      this.loadingStore.stop();
      this.resetForm();
      console.log('Form submitted successfully');
    }, 1500);
  }

  resetForm(): void {
    this.submitted = false;
    this.creditDriverForm.reset();
    this.filteredDrivers = [];
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.creditDriverForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.creditDriverForm.get(fieldName);

    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      fleetNumber: 'Fleet Number',
      driverId: 'Driver',
      activityDate: 'Driver Activity Date',
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
