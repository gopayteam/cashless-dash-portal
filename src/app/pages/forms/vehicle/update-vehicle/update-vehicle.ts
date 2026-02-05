// pages/vehicles/update-vehicle/update-vehicle.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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

interface Vehicle {
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

interface UpdateVehiclePayload {
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

interface VehiclesApiResponse {
  status: number;
  message: string;
  data: Vehicle[];
}

interface ApiResponse {
  status: number;
  message: string;
  data: any;
}

@Component({
  selector: 'app-update-vehicle',
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
  templateUrl: './update-vehicle.html',
  styleUrls: ['./update-vehicle.css', '../../../../../styles/global/_toast.css'],
  providers: [MessageService]
})
export class UpdateVehicleComponent implements OnInit {
  entityId: string | null = null;
  vehicleId: string = '';
  vehicleData: Vehicle | null = null;
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
  vehicleLoading: boolean = false;
  submitting: boolean = false;
  dataLoadedFromState: boolean = false;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.entityId = user.entityId;
    this.username = user.username || user.email;

    // Load dropdown data
    this.loadInvestors();
    this.loadMarshals();
    this.loadStages();

    // Get vehicle ID from route and initialize vehicle data
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (!id) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Vehicle ID not found in route',
          life: 4000
        });
        this.router.navigate(['/vehicles/all']);
        return;
      }

      this.vehicleId = id;
      this.initializeVehicleData();
    });
  }

  private initializeVehicleData(): void {
    const stateVehicle = this.getVehicleFromState();

    if (stateVehicle) {
      console.log('✓ Vehicle data loaded from navigation state');
      this.populateFormFromVehicle(stateVehicle);
      this.dataLoadedFromState = true;
    } else {
      console.log('⚠ No state data found, fetching from API');
      this.loadVehicleDataFromAPI(this.vehicleId!);
      this.dataLoadedFromState = false;
    }
  }

  private getVehicleFromState(): Vehicle | null {
    try {
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras?.state?.['vehicle']) {
        const stateVehicle = navigation.extras.state['vehicle'] as Vehicle;
        if (this.isValidVehicleObject(stateVehicle)) {
          return stateVehicle;
        }
      }

      if (window.history.state?.vehicle) {
        const historyVehicle = window.history.state.vehicle as Vehicle;
        if (this.isValidVehicleObject(historyVehicle)) {
          return historyVehicle;
        }
      }

      return null;
    } catch (error) {
      console.error('Error retrieving vehicle from state:', error);
      return null;
    }
  }

  private isValidVehicleObject(vehicle: any): boolean {
    return !!(
      vehicle &&
      typeof vehicle === 'object' &&
      vehicle.id &&
      vehicle.entityId &&
      vehicle.investorNumber &&
      vehicle.marshalNumber &&
      vehicle.fleetNumber &&
      vehicle.registrationNumber &&
      vehicle.capacity &&
      vehicle.stageId
    );
  }

  private populateFormFromVehicle(vehicle: Vehicle): void {
    this.vehicleData = vehicle;
    this.vehicleId = vehicle.id;
    this.investorNumber = vehicle.investorNumber || '';
    this.marshalNumber = vehicle.marshalNumber || '';
    this.fleetNumber = vehicle.fleetNumber || '';
    this.registrationNumber = vehicle.registrationNumber || '';
    this.capacity = vehicle.capacity;
    this.storeNumber = vehicle.storeNumber || '';
    this.tillNumber = vehicle.tillNumber || '';
    this.selectedStage = vehicle.stageId;
    this.maintainFees = vehicle.maintainFees || false;

    // Extract fee amounts from vehicleFees array
    if (vehicle.vehicleFees && Array.isArray(vehicle.vehicleFees)) {
      vehicle.vehicleFees.forEach((fee: VehicleFee) => {
        switch (fee.feeName) {
          case 'SYSTEM':
            this.systemFeeAmount = fee.feeAmount;
            break;
          case 'MANAGEMENT':
            this.managementFeeAmount = fee.feeAmount;
            break;
          case 'SACCO':
            this.saccoFeeAmount = fee.feeAmount;
            break;
          case 'OFFLOAD':
            if (fee.dayType === 'WEEKDAY') {
              this.offloadWeekdayFeeAmount = fee.feeAmount;
            } else if (fee.dayType === 'SATURDAY') {
              this.offloadSaturdayFeeAmount = fee.feeAmount;
            } else if (fee.dayType === 'SUNDAY') {
              this.offloadSundayFeeAmount = fee.feeAmount;
            }
            break;
          case 'DRIVER':
            this.driverFeeAmount = fee.feeAmount;
            break;
        }
      });
    }
  }

  private loadVehicleDataFromAPI(vehicleId: string): void {
    if (!this.entityId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Entity ID not found',
        life: 4000
      });
      this.router.navigate(['/vehicles/all']);
      return;
    }

    this.vehicleLoading = true;
    this.loadingStore.start();

    const payload = {
      entityId: this.entityId,
      page: 0,
      size: 1000
    };

    console.log('Fetching vehicle data from API for ID:', vehicleId);

    this.dataService
      .post<VehiclesApiResponse>(API_ENDPOINTS.ALL_VEHICLES, payload, 'get-vehicles')
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            const vehicle = response.data.find((v: Vehicle) => v.id === vehicleId);

            if (vehicle) {
              console.log('✓ Vehicle data fetched successfully from API');
              this.populateFormFromVehicle(vehicle);
            } else {
              this.handleVehicleNotFound(vehicleId);
            }
          } else {
            this.handleNoVehiclesAvailable();
          }

          this.vehicleLoading = false;
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load vehicle data from API:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch vehicle data. Please try again.',
            life: 4000
          });
          this.vehicleLoading = false;
          this.loadingStore.stop();
          this.router.navigate(['/vehicles/all']);
        },
      });
  }

  private handleVehicleNotFound(vehicleId: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warning',
      detail: `Vehicle with ID ${vehicleId} not found`,
      life: 4000
    });
    console.error('Vehicle not found with ID:', vehicleId);
    setTimeout(() => {
      this.router.navigate(['/vehicles/all']);
    }, 2000);
  }

  private handleNoVehiclesAvailable(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'No vehicle data available',
      life: 4000
    });
    console.error('No vehicles found in API response');
    setTimeout(() => {
      this.router.navigate(['/vehicles/all']);
    }, 2000);
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
    if (!this.entityId) return;

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
      this.vehicleId &&
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
    if (!this.isFormValid() || !this.entityId || !this.vehicleId || !this.username) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly',
        life: 4000
      });
      return;
    }

    // Build vehicleFees array
    const vehicleFees: VehicleFee[] = [
      {
        id: this.vehicleData?.vehicleFees?.find(f => f.feeName === 'SYSTEM')?.id || '',
        feeName: 'SYSTEM',
        dayType: 'ALL',
        feeAmount: this.systemFeeAmount!,
        username: this.username,
        entityId: this.entityId
      },
      {
        id: this.vehicleData?.vehicleFees?.find(f => f.feeName === 'MANAGEMENT')?.id || '',
        feeName: 'MANAGEMENT',
        dayType: 'ALL',
        feeAmount: this.managementFeeAmount!,
        username: this.username,
        entityId: this.entityId
      },
      {
        id: this.vehicleData?.vehicleFees?.find(f => f.feeName === 'SACCO')?.id || '',
        feeName: 'SACCO',
        dayType: 'ALL',
        feeAmount: this.saccoFeeAmount!,
        username: this.username,
        entityId: this.entityId
      },
      {
        id: this.vehicleData?.vehicleFees?.find(f => f.feeName === 'OFFLOAD' && f.dayType === 'WEEKDAY')?.id || '',
        feeName: 'OFFLOAD',
        dayType: 'WEEKDAY',
        feeAmount: this.offloadWeekdayFeeAmount!,
        username: this.username,
        entityId: this.entityId
      },
      {
        id: this.vehicleData?.vehicleFees?.find(f => f.feeName === 'OFFLOAD' && f.dayType === 'SATURDAY')?.id || '',
        feeName: 'OFFLOAD',
        dayType: 'SATURDAY',
        feeAmount: this.offloadSaturdayFeeAmount!,
        username: this.username,
        entityId: this.entityId
      },
      {
        id: this.vehicleData?.vehicleFees?.find(f => f.feeName === 'OFFLOAD' && f.dayType === 'SUNDAY')?.id || '',
        feeName: 'OFFLOAD',
        dayType: 'SUNDAY',
        feeAmount: this.offloadSundayFeeAmount!,
        username: this.username,
        entityId: this.entityId
      },
      {
        id: this.vehicleData?.vehicleFees?.find(f => f.feeName === 'DRIVER')?.id || '',
        feeName: 'DRIVER',
        dayType: 'ALL',
        feeAmount: this.driverFeeAmount!,
        username: this.username,
        entityId: this.entityId
      }
    ];

    const payload: UpdateVehiclePayload = {
      id: this.vehicleId,
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

    console.log('Updating vehicle with payload:', payload);

    this.submitting = true;
    this.loadingStore.start();

    this.dataService
      .post<ApiResponse>(API_ENDPOINTS.UPDATE_VEHICLE, payload, 'update-vehicle')
      .subscribe({
        next: (response) => {
          console.log('Vehicle updated successfully', response);
          this.submitting = false;
          this.loadingStore.stop();

          if (response.status == 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message || 'Vehicle updated successfully',
              life: 4000
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error Occurred',
              detail: response.message,
              life: 5000
            });
          }

          // Navigate back to vehicles list
          setTimeout(() => {
            this.router.navigate(['/vehicles/all']);
          }, 1500);
        },
        error: (err) => {
          console.error('Failed to update vehicle - Full error:', err);
          console.error('Error status:', err.status);
          console.error('Error details:', err.error);

          let errorMessage = 'Failed to update vehicle';

          if (err.status === 409) {
            errorMessage = 'Vehicle with this registration number already exists';
          } else if (err.status === 400) {
            errorMessage = err.error?.message || 'Invalid data provided. Please check your inputs.';
          } else if (err.status === 404) {
            errorMessage = 'Vehicle not found';
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

  onCancel(): void {
    this.router.navigate(['/vehicles/all']);
  }
}
