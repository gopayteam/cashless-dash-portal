// pages/vehicles/update-vehicle/update-vehicle.component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import { VehicleFee } from '../../../../../@core/models/vehicle/vehicle.model';
import { Organization } from '../../../../../@core/models/organization/organization.model';
import { forkJoin } from 'rxjs';
import { OrganizationsApiResponse } from '../../../../../@core/models/organization/organization-response.model';

interface DropdownOption {
  label: string;
  value: any;
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

interface VehicleFeesApiResponse {
  status: number;
  message: string;
  data: VehicleFee[];
  totalRecords: number;
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
  organization: Organization | null = null;

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

  // Store vehicle fees with IDs from API
  vehicleFeesWithIds: VehicleFee[] = [];

  // Dropdown options
  investorOptions: DropdownOption[] = [];
  marshalOptions: DropdownOption[] = [];
  stageOptions: DropdownOption[] = [];

  // Loading states
  investorsLoading: boolean = false;
  marshalsLoading: boolean = false;
  stagesLoading: boolean = false;
  vehicleLoading: boolean = false;
  organizationLoading: boolean = false;
  submitting: boolean = false;
  dataLoadedFromState: boolean = false;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
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

    // Get vehicle ID from route
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
      this.initializeData();
    });
  }

  private cleanPayload(obj: any) {
    Object.keys(obj).forEach(
      key => obj[key] === '' && delete obj[key]
    );
  }

  private initializeData(): void {
    const stateVehicle = this.getVehicleFromState();

    if (stateVehicle) {
      console.log('✓ Vehicle data loaded from navigation state');
      this.dataLoadedFromState = true;

      // Load dropdowns and organization data in parallel
      this.loadAllRequiredData(stateVehicle);
      this.cdr.detectChanges();
    } else {
      console.log('⚠ No state data found, fetching all data from API');
      this.dataLoadedFromState = false;
      this.loadAllDataFromAPI();
      this.cdr.detectChanges();
    }
  }

  private loadAllRequiredData(vehicle?: Vehicle): void {
    this.loadingStore.start();

    const requests = {
      investors: this.dataService.post<UserApiResponse>(
        API_ENDPOINTS.ALL_USERS,
        { entityId: this.entityId, agent: 'INVESTOR', page: 0, size: 100 },
        'investor-users', true,
      ),
      marshals: this.dataService.post<UserApiResponse>(
        API_ENDPOINTS.ALL_USERS,
        { entityId: this.entityId, agent: 'MARSHAL', page: 0, size: 100 },
        'marshall-users', true,
      ),
      stages: this.dataService.post<StagesResponse>(
        API_ENDPOINTS.ALL_STAGES,
        { entityId: this.entityId, page: 0, size: 100 },
        'stages', true,
      ),
      organization: this.dataService.post<OrganizationsApiResponse>(
        API_ENDPOINTS.ALL_ORGANIZATIONS,
        { entityId: this.entityId, page: 0, size: 200 },
        'organizations', true,
      )
    };

    forkJoin(requests).subscribe({
      next: (results) => {
        // Process investors
        this.investorOptions = results.investors.data.map((user: User) => ({
          label: `${user.firstName} ${user.lastName} - ${user.username}`,
          value: user.username,
        }));

        // Process marshals
        this.marshalOptions = results.marshals.data.map((user: User) => ({
          label: `${user.firstName} ${user.lastName} - ${user.username}`,
          value: user.username,
        }));

        // Process stages
        this.stageOptions = results.stages.data.map((stage: Stage) => ({
          label: stage.name,
          value: stage.id,
        }));

        // Process organization
        if (results.organization.data && results.organization.data.length > 0) {
          this.organization = results.organization.data[0];
          console.log('✓ Organization data loaded:', this.organization);
        }

        // If vehicle data from state, populate form
        if (vehicle) {
          this.loadVehicleFeesAndPopulateForm(vehicle);
        }

        this.loadingStore.stop();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load required data:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load required data. Please try again.',
          life: 4000
        });
        this.loadingStore.stop();
      }
    });
  }

  private loadAllDataFromAPI(): void {
    this.loadingStore.start();

    const requests = {
      investors: this.dataService.post<UserApiResponse>(
        API_ENDPOINTS.ALL_USERS,
        { entityId: this.entityId, agent: 'INVESTOR', page: 0, size: 100 },
        'investor-users', true,
      ),
      marshals: this.dataService.post<UserApiResponse>(
        API_ENDPOINTS.ALL_USERS,
        { entityId: this.entityId, agent: 'MARSHAL', page: 0, size: 100 },
        'marshall-users', true,
      ),
      stages: this.dataService.post<StagesResponse>(
        API_ENDPOINTS.ALL_STAGES,
        { entityId: this.entityId, page: 0, size: 100 },
        'stages', true,
      ),
      organization: this.dataService.post<OrganizationsApiResponse>(
        API_ENDPOINTS.ALL_ORGANIZATIONS,
        { entityId: this.entityId, page: 0, size: 200 },
        'organizations', true
      ),
      vehicle: this.dataService.postWithParams<VehiclesApiResponse>(
        API_ENDPOINTS.VEHICLE_DATA,
        { entityId: this.entityId!, fleetNumber: this.vehicleId }
      )
    };

    forkJoin(requests).subscribe({
      next: (results) => {
        // Process investors
        this.investorOptions = results.investors.data.map((user: User) => ({
          label: `${user.firstName} ${user.lastName} - ${user.username}`,
          value: user.username,
        }));

        // Process marshals
        this.marshalOptions = results.marshals.data.map((user: User) => ({
          label: `${user.firstName} ${user.lastName} - ${user.username}`,
          value: user.username,
        }));

        // Process stages
        this.stageOptions = results.stages.data.map((stage: Stage) => ({
          label: stage.name,
          value: stage.id,
        }));

        // Process organization
        if (results.organization.data && results.organization.data.length > 0) {
          this.organization = results.organization.data[0];
          console.log('✓ Organization data loaded:', this.organization);
        }

        // Process vehicle
        if (results.vehicle.data && results.vehicle.data.length > 0) {
          const vehicle = results.vehicle.data.find((v: Vehicle) => v.id === this.vehicleId);
          if (vehicle) {
            console.log('✓ Vehicle data fetched successfully from API');
            this.loadVehicleFeesAndPopulateForm(vehicle);
          } else {
            this.handleVehicleNotFound(this.vehicleId);
          }
        } else {
          this.handleNoVehiclesAvailable();
        }

        this.loadingStore.stop();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load data from API:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch data. Please try again.',
          life: 4000
        });
        this.loadingStore.stop();
        this.router.navigate(['/vehicles/all']);
      }
    });
  }

  private loadVehicleFeesAndPopulateForm(vehicle: Vehicle): void {
    // Encode fleet number for URL (handle spaces)
    const encodedFleetNumber = encodeURIComponent(vehicle.fleetNumber);

    const params = {
      entityId: this.entityId!,
      fleetNumber: encodedFleetNumber
    };

    this.dataService
      .post<VehicleFeesApiResponse>(API_ENDPOINTS.VEHICLE_FEES, params, 'vehicle-fees', true)
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            this.vehicleFeesWithIds = response.data;
            console.log('✓ Vehicle fees loaded:', this.vehicleFeesWithIds);
          }

          // Populate form with vehicle data and fees
          this.populateFormFromVehicle(vehicle);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load vehicle fees:', err);
          // Still populate form even if fees fail to load
          this.populateFormFromVehicle(vehicle);
          this.cdr.detectChanges();
        }
      });
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

    // Extract fee amounts from vehicleFeesWithIds (from API) or vehicle.vehicleFees (from state)
    const feesToUse = this.vehicleFeesWithIds.length > 0 ? this.vehicleFeesWithIds : vehicle.vehicleFees;

    if (feesToUse && Array.isArray(feesToUse)) {
      feesToUse.forEach((fee: VehicleFee) => {
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

    // If fees are not set, use organization default fees as fallback
    if (this.organization?.organizationCategoryFees) {
      if (this.systemFeeAmount === null) {
        const systemFee = this.organization.organizationCategoryFees.find(f => f.categoryName === 'SYSTEM');
        this.systemFeeAmount = systemFee?.feeAmount ?? 0;
      }
      if (this.managementFeeAmount === null) {
        const managementFee = this.organization.organizationCategoryFees.find(f => f.categoryName === 'MANAGEMENT');
        this.managementFeeAmount = managementFee?.feeAmount ?? 0;
      }
      if (this.saccoFeeAmount === null) {
        const saccoFee = this.organization.organizationCategoryFees.find(f => f.categoryName === 'SACCO');
        this.saccoFeeAmount = saccoFee?.feeAmount ?? 0;
      }
      if (this.offloadWeekdayFeeAmount === null || this.offloadSaturdayFeeAmount === null || this.offloadSundayFeeAmount === null) {
        const offloadFee = this.organization.organizationCategoryFees.find(f => f.categoryName === 'OFFLOAD');
        const defaultOffloadAmount = offloadFee?.feeAmount ?? 0;
        this.offloadWeekdayFeeAmount = this.offloadWeekdayFeeAmount ?? defaultOffloadAmount;
        this.offloadSaturdayFeeAmount = this.offloadSaturdayFeeAmount ?? defaultOffloadAmount;
        this.offloadSundayFeeAmount = this.offloadSundayFeeAmount ?? defaultOffloadAmount;
      }
      if (this.driverFeeAmount === null) {
        const driverFee = this.organization.organizationCategoryFees.find(f => f.categoryName === 'DRIVER');
        this.driverFeeAmount = driverFee?.feeAmount ?? 0;
      }
    }
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

  private getFeeId(feeName: string, dayType: string = 'ALL'): number | string | null {
    const fee = this.vehicleFeesWithIds.find(
      f => f.feeName === feeName && f.dayType === dayType
    );
    return fee?.id ?? null;
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

    // Build vehicleFees array with proper IDs from the fetched fees
    const vehicleFees: VehicleFee[] = [
      {
        id: this.getFeeId('SYSTEM', 'ALL'),
        feeName: 'SYSTEM',
        dayType: 'ALL',
        feeAmount: this.systemFeeAmount!,
        username: this.username,
        entityId: this.entityId,
      },
      {
        id: this.getFeeId('MANAGEMENT', 'ALL'),
        feeName: 'MANAGEMENT',
        dayType: 'ALL',
        feeAmount: this.managementFeeAmount!,
        username: this.username,
        entityId: this.entityId,
      },
      {
        id: this.getFeeId('SACCO', 'ALL'),
        feeName: 'SACCO',
        dayType: 'ALL',
        feeAmount: this.saccoFeeAmount!,
        username: this.username,
        entityId: this.entityId,
      },
      {
        id: this.getFeeId('OFFLOAD', 'WEEKDAY'),
        feeName: 'OFFLOAD',
        dayType: 'WEEKDAY',
        feeAmount: this.offloadWeekdayFeeAmount!,
        username: this.username,
        entityId: this.entityId,
      },
      {
        id: this.getFeeId('OFFLOAD', 'SATURDAY'),
        feeName: 'OFFLOAD',
        dayType: 'SATURDAY',
        feeAmount: this.offloadSaturdayFeeAmount!,
        username: this.username,
        entityId: this.entityId,
      },
      {
        id: this.getFeeId('OFFLOAD', 'SUNDAY'),
        feeName: 'OFFLOAD',
        dayType: 'SUNDAY',
        feeAmount: this.offloadSundayFeeAmount!,
        username: this.username,
        entityId: this.entityId,
      },
      {
        id: this.getFeeId('DRIVER', 'ALL'),
        feeName: 'DRIVER',
        dayType: 'ALL',
        feeAmount: this.driverFeeAmount!,
        username: this.username,
        entityId: this.entityId,
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
      username: this.username,
      // storeNumber: this.storeNumber ? this.storeNumber : '',
      // tillNumber: this.tillNumber ? this.tillNumber : '',
    };

    // Add optional fields only if they have values
    if (this.storeNumber.trim()) {
      payload.storeNumber = this.storeNumber.trim();
    }
    if (this.tillNumber.trim()) {
      payload.tillNumber = this.tillNumber.trim();
    }

    this.cleanPayload(payload);

    if (vehicleFees.some(f => f.id === null)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Fee configuration missing. Please refresh the page.',
        life: 4000
      });
      return;
    }

    console.log('Updating vehicle with payload:', payload);

    this.submitting = true;
    this.loadingStore.start();

    this.dataService
      .post<ApiResponse>(API_ENDPOINTS.UPDATE_VEHICLE, payload, 'update-vehicle', true)
      .subscribe({
        next: (response) => {

          this.submitting = false;
          this.loadingStore.stop();

          if (response.status == 0) {
            console.log('Vehicle updated successfully', response);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message || 'Vehicle updated successfully',
              life: 4000
            });

            // Navigate back to vehicles list
            setTimeout(() => {
              this.router.navigate(['/vehicles/all']);
            }, 1500);
          } else {
            console.log('Vehicle update failed', response);
            this.messageService.add({
              severity: 'error',
              summary: 'Error Occurred',
              detail: response.message,
              life: 5000
            });
          }
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
