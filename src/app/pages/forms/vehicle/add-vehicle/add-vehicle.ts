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

interface VehiclePayload {
  entityId: string;
  investorId: number;
  fleetNumber: string;
  regNumber: string;
  capacity: number;
  marshalId: number;
  storeNumber?: string;
  tillNumber?: string;
  stageId: number;
  vehicleFees?: number;
  systemFeeAmount: number;
  managementFeeAmount: number;
  saccoFeeAmount: number;
  offloadWeekdayFeeAmount: number;
  offloadSaturdayFeeAmount: number;
  offloadSundayFeeAmount: number;
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

  // Form fields
  selectedInvestor: number | null = null;
  fleetNumber: string = '';
  regNumber: string = '';
  capacity: number | null = null;
  selectedMarshal: number | null = null;
  storeNumber: string = '';
  tillNumber: string = '';
  selectedStage: number | null = null;
  vehicleFees: number | null = null;
  systemFeeAmount: number | null = null;
  managementFeeAmount: number | null = null;
  saccoFeeAmount: number | null = null;
  offloadWeekdayFeeAmount: number | null = null;
  offloadSaturdayFeeAmount: number | null = null;
  offloadSundayFeeAmount: number | null = null;

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
            value: user.id,
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
            value: user.id,
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
      this.selectedInvestor &&
      this.fleetNumber.trim() &&
      this.regNumber.trim() &&
      this.capacity &&
      this.capacity > 0 &&
      this.selectedMarshal &&
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
      this.offloadSundayFeeAmount >= 0
    );
  }

  onSubmit(): void {
    if (!this.isFormValid() || !this.entityId) {
      return;
    }

    const payload: VehiclePayload = {
      entityId: this.entityId,
      investorId: this.selectedInvestor!,
      fleetNumber: this.fleetNumber.trim(),
      regNumber: this.regNumber.trim(),
      capacity: this.capacity!,
      marshalId: this.selectedMarshal!,
      stageId: this.selectedStage!,
      vehicleFees: this.vehicleFees || 0,
      systemFeeAmount: this.systemFeeAmount!,
      managementFeeAmount: this.managementFeeAmount!,
      saccoFeeAmount: this.saccoFeeAmount!,
      offloadWeekdayFeeAmount: this.offloadWeekdayFeeAmount!,
      offloadSaturdayFeeAmount: this.offloadSaturdayFeeAmount!,
      offloadSundayFeeAmount: this.offloadSundayFeeAmount!,
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
    this.selectedInvestor = null;
    this.fleetNumber = '';
    this.regNumber = '';
    this.capacity = null;
    this.selectedMarshal = null;
    this.storeNumber = '';
    this.tillNumber = '';
    this.selectedStage = null;
    this.vehicleFees = null;
    this.systemFeeAmount = null;
    this.managementFeeAmount = null;
    this.saccoFeeAmount = null;
    this.offloadWeekdayFeeAmount = null;
    this.offloadSaturdayFeeAmount = null;
    this.offloadSundayFeeAmount = null;
  }
}
