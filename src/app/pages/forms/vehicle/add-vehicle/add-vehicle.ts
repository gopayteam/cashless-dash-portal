// pages/vehicles/add-vehicle/add-vehicle.component.ts
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
import { UserApiResponse } from '../../../../../@core/models/user/user_api_Response.mode';
import { API_ENDPOINTS } from '../../../../../@core/api/endpoints';
import { User } from '../../../../../@core/models/user/user.model';
import { StagesResponse } from '../../../../../@core/models/locations/state_response.model';
import { Stage } from '../../../../../@core/models/locations/stage.model';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface DropdownOption {
  label: string;
  value: any;
}

interface VehicleFee {
  id: string;
  feeName: string;
  dayType: string;
  feeAmount: number;
  username: string;
  entityId: string;
}

interface VehiclePayload {
  id: string;
  entityId: string;
  investorNumber: string;
  marshalNumber: string;
  fleetNumber: string;
  registrationNumber: string;
  capacity: number;
  storeNumber?: string;
  tillNumber?: string;
  stageId: number;
  maintainFees: boolean;
  vehicleFees: VehicleFee[];
  username: string;
}

@Component({
  selector: 'app-add-vehicle',
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
  templateUrl: './add-vehicle.html',
  styleUrls: ['./add-vehicle.css', '../../../../../styles/global/_toast.css'],
})
export class AddVehicleComponent implements OnInit {
  entityId: string | null = null;
  username: string | null = null;

  // Form fields
  investorNumber: string = '';
  marshalNumber: string = '';
  fleetNumber: string = '';
  registrationNumber: string = '';
  capacity: number | null = null;
  storeNumber: string = '';
  tillNumber: string = '';
  selectedStage: number | null = null;
  maintainFees: boolean = false;

  // Fee amounts
  systemFeeAmount: number | null = null;
  managementFeeAmount: number | null = null;
  saccoFeeAmount: number | null = null;
  offloadWeekdayFeeAmount: number | null = null;
  offloadSaturdayFeeAmount: number | null = null;
  offloadSundayFeeAmount: number | null = null;
  driverFeeAmount: number | null = null;

  // Dropdown options
  investorOptions: DropdownOption[] = [];
  marshalOptions: DropdownOption[] = [];
  stageOptions: DropdownOption[] = [];

  // Loading states
  investorsLoading: boolean = false;
  marshalsLoading: boolean = false;
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
      this.username = user.username || user.email;
    } else {
      this.router.navigate(['/login']);
      return;
    }

    this.loadInvestors();
    this.loadMarshals();
    this.loadStages();
  }

  loadInvestors(): void {
    if (!this.entityId) return;

    this.investorsLoading = true;
    const payload = {
      entityId: this.entityId,
      agent: 'INVESTOR',
      page: 0,
      size: 100,
    };

    this.dataService
      .post<UserApiResponse>(API_ENDPOINTS.ALL_USERS, payload, 'investor-users')
      .subscribe({
        next: (response) => {
          this.investorOptions = response.data.map((user: User) => ({
            label: `${user.firstName} ${user.lastName} - ${user.username}`,
            value: user.phoneNumber,
          }));
          this.investorsLoading = false;
        },
        error: (err) => {
          console.error('Failed to load investors', err);
          this.investorsLoading = false;
        },
      });
  }

  loadMarshals(): void {
    if (!this.entityId) return;

    this.marshalsLoading = true;
    const payload = {
      entityId: this.entityId,
      agent: 'MARSHAL',
      page: 0,
      size: 100,
    };

    this.dataService
      .post<UserApiResponse>(API_ENDPOINTS.ALL_USERS, payload, 'marshall-users')
      .subscribe({
        next: (response) => {
          this.marshalOptions = response.data.map((user: User) => ({
            label: `${user.firstName} ${user.lastName} - ${user.username}`,
            value: user.phoneNumber,
          }));
          this.marshalsLoading = false;
        },
        error: (err) => {
          console.error('Failed to load marshals', err);
          this.marshalsLoading = false;
        },
      });
  }

  loadStages(): void {
    this.stagesLoading = true;
    const payload = {
      entityId: this.entityId,
      page: 0,
      size: 100,
    };

    this.dataService
      .post<StagesResponse>(API_ENDPOINTS.ALL_STAGES, payload, 'stages')
      .subscribe({
        next: (response) => {
          this.stageOptions = response.data.map((stage: Stage) => ({
            label: stage.name,
            value: stage.id,
          }));
          this.stagesLoading = false;
        },
        error: (err) => {
          console.error('Failed to load stages', err);
          this.stagesLoading = false;
        },
      });
  }

  isFormValid(): boolean {
    return !!(
      this.investorNumber.trim() &&
      this.marshalNumber.trim() &&
      this.fleetNumber.trim() &&
      this.registrationNumber.trim() &&
      this.capacity &&
      this.capacity > 0 &&
      this.selectedStage &&
      this.systemFeeAmount !== null &&
      this.systemFeeAmount >= 0 &&
      this.managementFeeAmount !== null &&
      this.managementFeeAmount >= 0 &&
      this.saccoFeeAmount !== null &&
      this.saccoFeeAmount >= 0 &&
      this.offloadWeekdayFeeAmount !== null &&
      this.offloadWeekdayFeeAmount >= 0 &&
      this.offloadSaturdayFeeAmount !== null &&
      this.offloadSaturdayFeeAmount >= 0 &&
      this.offloadSundayFeeAmount !== null &&
      this.offloadSundayFeeAmount >= 0 &&
      this.driverFeeAmount !== null &&
      this.driverFeeAmount >= 0
    );
  }

  onSubmit(): void {
    if (!this.isFormValid() || !this.entityId || !this.username) {
      return;
    }

    // Build vehicleFees array
    const vehicleFees: VehicleFee[] = [
      {
        id: '',
        feeName: 'SYSTEM',
        dayType: 'ALL',
        feeAmount: this.systemFeeAmount!,
        username: this.username,
        entityId: this.entityId
      },
      {
        id: '',
        feeName: 'MANAGEMENT',
        dayType: 'ALL',
        feeAmount: this.managementFeeAmount!,
        username: this.username,
        entityId: this.entityId
      },
      {
        id: '',
        feeName: 'SACCO',
        dayType: 'ALL',
        feeAmount: this.saccoFeeAmount!,
        username: this.username,
        entityId: this.entityId
      },
      {
        id: '',
        feeName: 'OFFLOAD',
        dayType: 'WEEKDAY',
        feeAmount: this.offloadWeekdayFeeAmount!,
        username: this.username,
        entityId: this.entityId
      },
      {
        id: '',
        feeName: 'OFFLOAD',
        dayType: 'SATURDAY',
        feeAmount: this.offloadSaturdayFeeAmount!,
        username: this.username,
        entityId: this.entityId
      },
      {
        id: '',
        feeName: 'OFFLOAD',
        dayType: 'SUNDAY',
        feeAmount: this.offloadSundayFeeAmount!,
        username: this.username,
        entityId: this.entityId
      },
      {
        id: '',
        feeName: 'DRIVER',
        dayType: 'ALL',
        feeAmount: this.driverFeeAmount!,
        username: this.username,
        entityId: this.entityId
      }
    ];

    const payload: VehiclePayload = {
      id: '',
      entityId: this.entityId,
      investorNumber: this.investorNumber.trim(),
      marshalNumber: this.marshalNumber.trim(),
      fleetNumber: this.fleetNumber.trim(),
      registrationNumber: this.registrationNumber.trim(),
      capacity: this.capacity!,
      stageId: this.selectedStage!,
      maintainFees: this.maintainFees,
      vehicleFees: vehicleFees,
      username: this.username
    };

    // Add optional fields only if they have values
    if (this.storeNumber.trim()) {
      payload.storeNumber = this.storeNumber.trim();
    }
    if (this.tillNumber.trim()) {
      payload.tillNumber = this.tillNumber.trim();
    }

    this.submitting = true;
    this.loadingStore.start();

    this.dataService
      .post(API_ENDPOINTS.CREATE_VEHICLE, payload, 'create-vehicle')
      .subscribe({
        next: (response) => {
          console.log('Vehicle created successfully', response);

          // Show validation success toast
          this.messageService.add({
            severity: 'success',
            summary: 'Created Successfully',
            detail: 'Vehicle created successfully',
            life: 4000
          });

          this.submitting = false;
          this.loadingStore.stop();
          this.router.navigate(['/vehicles/all']);
        },
        error: (err) => {
          console.error('Failed to create vehicle', err);

          // Show validation error toast
          this.messageService.add({
            severity: 'error',
            summary: 'Error Occurred',
            detail: 'Failed to create vehicle',
            life: 4000
          });

          this.submitting = false;
          this.loadingStore.stop();
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/vehicles/all']);
  }

  resetForm(): void {
    this.investorNumber = '';
    this.marshalNumber = '';
    this.fleetNumber = '';
    this.registrationNumber = '';
    this.capacity = null;
    this.storeNumber = '';
    this.tillNumber = '';
    this.selectedStage = null;
    this.maintainFees = false;
    this.systemFeeAmount = null;
    this.managementFeeAmount = null;
    this.saccoFeeAmount = null;
    this.offloadWeekdayFeeAmount = null;
    this.offloadSaturdayFeeAmount = null;
    this.offloadSundayFeeAmount = null;
    this.driverFeeAmount = null;
  }
}
