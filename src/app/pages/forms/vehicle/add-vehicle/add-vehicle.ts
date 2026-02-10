// pages/vehicles/add-vehicle/add-vehicle.component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import { VehicleFee } from '../../../../../@core/models/vehicle/vehicle.model';
import { Organization } from '../../../../../@core/models/organization/organization.model';
import { forkJoin } from 'rxjs';
import { OrganizationsApiResponse } from '../../../../../@core/models/organization/organization-response.model';

interface DropdownOption {
  label: string;
  value: any;
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

interface ApiResponse {
  status: number;
  message: string;
  data: any;
  totalRecords: number;
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
  providers: [MessageService]
})
export class AddVehicleComponent implements OnInit {
  entityId: string | null = null;
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

  // Dropdown options
  investorOptions: DropdownOption[] = [];
  marshalOptions: DropdownOption[] = [];
  stageOptions: DropdownOption[] = [];

  // Loading states
  investorsLoading: boolean = false;
  marshalsLoading: boolean = false;
  stagesLoading: boolean = false;
  organizationLoading: boolean = false;
  submitting: boolean = false;
  initialDataLoaded: boolean = false;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
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

    // Load all required data in parallel
    this.loadInitialData();
  }

  private loadInitialData(): void {
    if (!this.entityId) return;

    this.loadingStore.start();

    const requests = {
      investors: this.dataService.post<UserApiResponse>(
        API_ENDPOINTS.ALL_USERS,
        { entityId: this.entityId, agent: 'INVESTOR', page: 0, size: 100 },
        'investor-users'
      ),
      marshals: this.dataService.post<UserApiResponse>(
        API_ENDPOINTS.ALL_USERS,
        { entityId: this.entityId, agent: 'MARSHAL', page: 0, size: 100 },
        'marshall-users'
      ),
      stages: this.dataService.post<StagesResponse>(
        API_ENDPOINTS.ALL_STAGES,
        { entityId: this.entityId, page: 0, size: 100 },
        'stages'
      ),
      organization: this.dataService.post<OrganizationsApiResponse>(
        API_ENDPOINTS.ALL_ORGANIZATIONS,
        { entityId: this.entityId, page: 0, size: 200 },
        'organizations'
      )
    };

    forkJoin(requests).subscribe({
      next: (results) => {
        // Process investors
        this.investorOptions = results.investors.data.map((user: User) => ({
          label: `${user.firstName} ${user.lastName} - ${user.username}`,
          value: user.phoneNumber,
        }));

        // Process marshals
        this.marshalOptions = results.marshals.data.map((user: User) => ({
          label: `${user.firstName} ${user.lastName} - ${user.username}`,
          value: user.phoneNumber,
        }));

        // Process stages
        this.stageOptions = results.stages.data.map((stage: Stage) => ({
          label: stage.name,
          value: stage.id,
        }));

        // Process organization and set default fees
        if (results.organization.data && results.organization.data.length > 0) {
          this.organization = results.organization.data[0];
          console.log('✓ Organization data loaded:', this.organization);
          this.setDefaultFeesFromOrganization();
        } else {
          console.warn('⚠ No organization data found, fees will need to be entered manually');
          this.setDefaultFeesToZero();
        }

        this.initialDataLoaded = true;
        this.loadingStore.stop();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load initial data:', err);
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

  private setDefaultFeesFromOrganization(): void {
    if (!this.organization?.organizationCategoryFees) {
      this.setDefaultFeesToZero();
      return;
    }

    const fees = this.organization.organizationCategoryFees;

    // Find and set SYSTEM fee
    const systemFee = fees.find(f => f.categoryName === 'SYSTEM');
    this.systemFeeAmount = systemFee?.feeAmount ?? 0;

    // Find and set MANAGEMENT fee
    const managementFee = fees.find(f => f.categoryName === 'MANAGEMENT');
    this.managementFeeAmount = managementFee?.feeAmount ?? 0;

    // Find and set SACCO fee
    const saccoFee = fees.find(f => f.categoryName === 'SACCO');
    this.saccoFeeAmount = saccoFee?.feeAmount ?? 0;

    // Find and set OFFLOAD fee (same for all days by default, can be changed)
    const offloadFee = fees.find(f => f.categoryName === 'OFFLOAD');
    const defaultOffloadAmount = offloadFee?.feeAmount ?? 0;
    this.offloadWeekdayFeeAmount = defaultOffloadAmount;
    this.offloadSaturdayFeeAmount = defaultOffloadAmount;
    this.offloadSundayFeeAmount = defaultOffloadAmount;

    // Find and set DRIVER fee
    const driverFee = fees.find(f => f.categoryName === 'DRIVER');
    this.driverFeeAmount = driverFee?.feeAmount ?? 0;

    console.log('✓ Default fees set from organization:', {
      system: this.systemFeeAmount,
      management: this.managementFeeAmount,
      sacco: this.saccoFeeAmount,
      offloadWeekday: this.offloadWeekdayFeeAmount,
      offloadSaturday: this.offloadSaturdayFeeAmount,
      offloadSunday: this.offloadSundayFeeAmount,
      driver: this.driverFeeAmount
    });
  }

  private setDefaultFeesToZero(): void {
    this.systemFeeAmount = 0;
    this.managementFeeAmount = 0;
    this.saccoFeeAmount = 0;
    this.offloadWeekdayFeeAmount = 0;
    this.offloadSaturdayFeeAmount = 0;
    this.offloadSundayFeeAmount = 0;
    this.driverFeeAmount = 0;
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
          this.cdr.detectChanges();
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
          this.cdr.detectChanges();
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
          this.cdr.detectChanges();
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
        id: '',
        feeName: 'SYSTEM',
        dayType: 'ALL',
        feeAmount: this.systemFeeAmount!,
        username: this.username,
        entityId: this.entityId,
      },
      {
        id: '',
        feeName: 'MANAGEMENT',
        dayType: 'ALL',
        feeAmount: this.managementFeeAmount!,
        username: this.username,
        entityId: this.entityId,
      },
      {
        id: '',
        feeName: 'SACCO',
        dayType: 'ALL',
        feeAmount: this.saccoFeeAmount!,
        username: this.username,
        entityId: this.entityId,
      },
      {
        id: '',
        feeName: 'OFFLOAD',
        dayType: 'WEEKDAY',
        feeAmount: this.offloadWeekdayFeeAmount!,
        username: this.username,
        entityId: this.entityId,
      },
      {
        id: '',
        feeName: 'OFFLOAD',
        dayType: 'SATURDAY',
        feeAmount: this.offloadSaturdayFeeAmount!,
        username: this.username,
        entityId: this.entityId,
      },
      {
        id: '',
        feeName: 'OFFLOAD',
        dayType: 'SUNDAY',
        feeAmount: this.offloadSundayFeeAmount!,
        username: this.username,
        entityId: this.entityId,
      },
      {
        id: '',
        feeName: 'DRIVER',
        dayType: 'ALL',
        feeAmount: this.driverFeeAmount!,
        username: this.username,
        entityId: this.entityId,
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

    console.log('Creating vehicle with payload:', payload);

    this.submitting = true;
    this.loadingStore.start();

    this.dataService
      .post<ApiResponse>(API_ENDPOINTS.CREATE_VEHICLE, payload, 'create-vehicle')
      .subscribe({
        next: (response) => {
          console.log('Vehicle created successfully', response);
          this.submitting = false;
          this.loadingStore.stop();

          if (response.status === 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message || 'Vehicle created successfully',
              life: 4000
            });

            // Navigate back to vehicles list
            setTimeout(() => {
              this.router.navigate(['/vehicles/all']);
            }, 1500);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error Occurred',
              detail: response.message || 'Failed to create vehicle',
              life: 5000
            });
          }
        },
        error: (err) => {
          console.error('Failed to create vehicle - Full error:', err);
          console.error('Error status:', err.status);
          console.error('Error details:', err.error);

          let errorMessage = 'Failed to create vehicle';

          if (err.status === 409) {
            errorMessage = 'Vehicle with this registration number or fleet number already exists';
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
          this.cdr.detectChanges();
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

    // Reset fees to organization defaults
    this.setDefaultFeesFromOrganization();
  }
}
