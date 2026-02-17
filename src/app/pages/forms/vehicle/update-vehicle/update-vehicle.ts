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

// ── Shared fee-row types (copy from add-vehicle or move to a shared model) ──

export interface FeeRow {
  label: string;
  modelKey: FeeModelKey;
  feeName: string;
  dayType: string;
  icon: string;
  hint?: string;
}

export type FeeModelKey =
  | 'systemFeeAmount'
  | 'managementFeeAmount'
  | 'saccoFeeAmount'
  | 'offloadWeekdayFeeAmount'
  | 'offloadSaturdayFeeAmount'
  | 'offloadSundayFeeAmount'
  | 'driverFeeAmount';

interface DropdownOption {
  label: string;
  value: any;
}

interface VehicleState {
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
  otpApproverNumber: string;
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
  data: VehicleState[];
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
  vehicleData: VehicleState | null = null;
  username: string | null = null;
  organization: Organization | null = null;

  // ── Basic form fields ────────────────────────────────────────────────────
  investorNumber: string = '';
  marshalNumber: string = '';
  fleetNumber: string = '';
  registrationNumber: string = '';
  capacity: number | null = null;
  storeNumber: string = '';
  tillNumber: string = '';
  selectedStage: number | null = null;
  maintainFees: boolean = false;

  // ── Fee amounts ──────────────────────────────────────────────────────────
  systemFeeAmount: number | null = null;
  managementFeeAmount: number | null = null;
  saccoFeeAmount: number | null = null;
  offloadWeekdayFeeAmount: number | null = null;
  offloadSaturdayFeeAmount: number | null = null;
  offloadSundayFeeAmount: number | null = null;
  driverFeeAmount: number | null = null;

  /** Ordered fee rows built from the organisation's category configuration */
  feeRows: FeeRow[] = [];

  /**
   * Fees fetched from the vehicle-fees API — these carry the real IDs
   * that must be included in the update payload.
   */
  vehicleFeesWithIds: VehicleFee[] = [];

  // ── Dropdown options ─────────────────────────────────────────────────────
  investorOptions: DropdownOption[] = [];
  marshalOptions: DropdownOption[] = [];
  stageOptions: DropdownOption[] = [];

  // ── Loading states ───────────────────────────────────────────────────────
  investorsLoading: boolean = false;
  marshalsLoading: boolean = false;
  stagesLoading: boolean = false;
  submitting: boolean = false;
  dataLoadedFromState: boolean = false;
  initialDataLoaded: boolean = false;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  get loading() { return this.loadingStore.loading; }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) { this.router.navigate(['/login']); return; }

    this.entityId = user.entityId;
    this.username = user.username || user.email;

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (!id) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Vehicle ID not found', life: 4000 });
        this.router.navigate(['/vehicles/all']);
        return;
      }
      this.vehicleId = id;
      this.initializeData();
    });
  }

  // ── Initialisation ────────────────────────────────────────────────────────

  private initializeData(): void {
    const stateVehicle = this.getVehicleFromState();
    if (stateVehicle) {
      this.dataLoadedFromState = true;
      this.loadAllRequiredData(stateVehicle);
    } else {
      this.dataLoadedFromState = false;
      this.loadAllDataFromAPI();
    }
  }

  private loadAllRequiredData(vehicle?: VehicleState): void {
    this.loadingStore.start();

    forkJoin({
      investors: this.dataService.post<UserApiResponse>(
        API_ENDPOINTS.ALL_USERS,
        { entityId: this.entityId, agent: 'INVESTOR', page: 0, size: 100 },
        'investor-users', true
      ),
      marshals: this.dataService.post<UserApiResponse>(
        API_ENDPOINTS.ALL_USERS,
        { entityId: this.entityId, agent: 'MARSHAL', page: 0, size: 100 },
        'marshall-users', true
      ),
      stages: this.dataService.post<StagesResponse>(
        API_ENDPOINTS.ALL_STAGES,
        { entityId: this.entityId, page: 0, size: 100 },
        'stages', true
      ),
      organization: this.dataService.post<OrganizationsApiResponse>(
        API_ENDPOINTS.ALL_ORGANIZATIONS,
        { entityId: this.entityId, page: 0, size: 200 },
        'organizations', true
      )
    }).subscribe({
      next: (results) => {
        this.investorOptions = results.investors.data.map((u: User) => ({
          label: `${u.firstName} ${u.lastName} - ${u.username}`,
          value: u.username,
        }));
        this.marshalOptions = results.marshals.data.map((u: User) => ({
          label: `${u.firstName} ${u.lastName} - ${u.username}`,
          value: u.username,
        }));
        this.stageOptions = results.stages.data.map((s: Stage) => ({
          label: s.name,
          value: s.id,
        }));

        if (results.organization.data?.length) {
          this.organization = results.organization.data[0];
          this.buildFeeRows(); // build rows BEFORE populating values
        } else {
          this.buildFeeRows();
        }

        if (vehicle) {
          this.loadVehicleFeesAndPopulate(vehicle);
        }

        this.loadingStore.stop();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load required data:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load required data.', life: 4000 });
        this.loadingStore.stop();
      }
    });
  }

  private loadAllDataFromAPI(): void {
    this.loadingStore.start();

    forkJoin({
      investors: this.dataService.post<UserApiResponse>(
        API_ENDPOINTS.ALL_USERS,
        { entityId: this.entityId, agent: 'INVESTOR', page: 0, size: 100 },
        'investor-users', true
      ),
      marshals: this.dataService.post<UserApiResponse>(
        API_ENDPOINTS.ALL_USERS,
        { entityId: this.entityId, agent: 'MARSHAL', page: 0, size: 100 },
        'marshall-users', true
      ),
      stages: this.dataService.post<StagesResponse>(
        API_ENDPOINTS.ALL_STAGES,
        { entityId: this.entityId, page: 0, size: 100 },
        'stages', true
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
    }).subscribe({
      next: (results) => {
        this.investorOptions = results.investors.data.map((u: User) => ({
          label: `${u.firstName} ${u.lastName} - ${u.username}`,
          value: u.username,
        }));
        this.marshalOptions = results.marshals.data.map((u: User) => ({
          label: `${u.firstName} ${u.lastName} - ${u.username}`,
          value: u.username,
        }));
        this.stageOptions = results.stages.data.map((s: Stage) => ({
          label: s.name,
          value: s.id,
        }));

        if (results.organization.data?.length) {
          this.organization = results.organization.data[0];
          this.buildFeeRows();
        } else {
          this.buildFeeRows();
        }

        const vehicle = results.vehicle.data?.find((v: VehicleState) => v.id === this.vehicleId);
        if (vehicle) {
          this.loadVehicleFeesAndPopulate(vehicle);
        } else {
          this.handleVehicleNotFound(this.vehicleId);
        }

        this.loadingStore.stop();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load data from API:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data.', life: 4000 });
        this.loadingStore.stop();
        this.router.navigate(['/vehicles/all']);
      }
    });
  }

  private loadVehicleFeesAndPopulate(vehicle: VehicleState): void {
    const encoded = encodeURIComponent(vehicle.fleetNumber);

    this.dataService.post<VehicleFeesApiResponse>(
      API_ENDPOINTS.VEHICLE_FEES,
      { entityId: this.entityId!, fleetNumber: encoded },
      'vehicle-fees',
      true
    ).subscribe({
      next: (response) => {
        if (response.data?.length) {
          this.vehicleFeesWithIds = response.data;
        }
        this.populateFormFromVehicle(vehicle);
        this.initialDataLoaded = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load vehicle fees:', err);
        this.populateFormFromVehicle(vehicle);
        this.initialDataLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Fee row construction ──────────────────────────────────────────────────

  /**
   * Identical logic to AddVehicleComponent.
   * Build rows from the org's configured categories sorted by priority.
   */
  buildFeeRows(): void {
    const categories = this.organization?.organizationCategoryFees ?? [];
    const sorted = [...categories].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    const rows: FeeRow[] = [];

    for (const cat of sorted) {
      switch (cat.categoryName) {
        case 'SYSTEM':
          rows.push({ label: 'System Fee', modelKey: 'systemFeeAmount', feeName: 'SYSTEM', dayType: 'ALL', icon: 'pi-cog', hint: 'Platform transaction fee' });
          break;
        case 'MANAGEMENT':
          rows.push({ label: 'Management Fee', modelKey: 'managementFeeAmount', feeName: 'MANAGEMENT', dayType: 'ALL', icon: 'pi-briefcase', hint: 'Organisation management fee' });
          break;
        case 'SACCO':
          rows.push({ label: 'SACCO Fee', modelKey: 'saccoFeeAmount', feeName: 'SACCO', dayType: 'ALL', icon: 'pi-building', hint: 'SACCO contribution' });
          break;
        case 'OFFLOAD':
          rows.push(
            { label: 'Offload Fee – Weekday', modelKey: 'offloadWeekdayFeeAmount', feeName: 'OFFLOAD', dayType: 'WEEKDAY', icon: 'pi-calendar', hint: 'Monday – Friday' },
            { label: 'Offload Fee – Saturday', modelKey: 'offloadSaturdayFeeAmount', feeName: 'OFFLOAD', dayType: 'SATURDAY', icon: 'pi-calendar', hint: 'Saturday rate' },
            { label: 'Offload Fee – Sunday', modelKey: 'offloadSundayFeeAmount', feeName: 'OFFLOAD', dayType: 'SUNDAY', icon: 'pi-calendar', hint: 'Sunday / public holiday rate' }
          );
          break;
        case 'DRIVER':
          rows.push({ label: 'Driver Fee', modelKey: 'driverFeeAmount', feeName: 'DRIVER', dayType: 'ALL', icon: 'pi-user', hint: 'Driver incentive fee' });
          break;
        default:
          console.warn(`Unknown fee category: ${cat.categoryName}`);
      }
    }

    this.feeRows = rows;
  }

  /**
   * Populates form fields from the vehicle object.
   * Fee amounts come from vehicleFeesWithIds (API) first, falling back to
   * vehicle.vehicleFees (state), then org defaults.
   */
  private populateFormFromVehicle(vehicle: VehicleState): void {
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

    // Source of truth for fee amounts: prefer fresh API fees, then state fees
    const feeSrc: VehicleFee[] =
      this.vehicleFeesWithIds.length > 0
        ? this.vehicleFeesWithIds
        : (vehicle.vehicleFees ?? []);

    const findFee = (name: string, day: string): number | null => {
      const f = feeSrc.find(x => x.feeName === name && x.dayType === day);
      return f?.feeAmount ?? null;
    };

    // Only set values for categories that exist in feeRows
    for (const row of this.feeRows) {
      const fetched = findFee(row.feeName, row.dayType);

      if (fetched !== null) {
        // We have a real value from the vehicle's fees
        this.setFeeValue(row.modelKey, fetched);
      } else {
        // Fall back to org default (null → 0)
        const orgCat = this.organization?.organizationCategoryFees?.find(
          c => c.categoryName === row.feeName
        );
        this.setFeeValue(row.modelKey, orgCat?.feeAmount ?? 0);
      }
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getFeeValue(key: FeeModelKey): number | null {
    return (this as any)[key] as number | null;
  }

  setFeeValue(key: FeeModelKey, value: number | null): void {
    (this as any)[key] = value;
  }

  /**
   * Looks up the stored fee ID for a feeName+dayType combination.
   * Returns null if not found — the submit guard will block if any are missing.
   */
  private getFeeId(feeName: string, dayType: string): string | number | null {
    const f = this.vehicleFeesWithIds.find(
      x => x.feeName === feeName && x.dayType === dayType
    );
    return f?.id ?? null;
  }

  // ── Validation ────────────────────────────────────────────────────────────

  isFormValid(): boolean {
    const basic = !!(
      this.vehicleId &&
      this.investorNumber.trim() &&
      this.marshalNumber.trim() &&
      this.fleetNumber.trim() &&
      this.registrationNumber.trim() &&
      this.capacity && this.capacity > 0 &&
      this.selectedStage
    );
    if (!basic) return false;

    return this.feeRows.every(row => {
      const val = this.getFeeValue(row.modelKey);
      return val !== null && val >= 0;
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (!this.isFormValid() || !this.entityId || !this.vehicleId || !this.username) {
      this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill in all required fields correctly', life: 4000 });
      return;
    }

    // Build fees — include the stored ID for each row
    const vehicleFees: VehicleFee[] = this.feeRows.map(row => ({
      id: this.getFeeId(row.feeName, row.dayType),
      feeName: row.feeName,
      dayType: row.dayType,
      feeAmount: this.getFeeValue(row.modelKey) ?? 0,
      username: this.username!,
      entityId: this.entityId!,
    }));

    // Format the OTP approver number (marshal number)
    let otpApproverNumber: string | undefined;
    if (this.marshalNumber) {
      // Use the globalService.formatPhoneNumber if available, or just trim
      otpApproverNumber = this.marshalNumber.trim();
    }

    // Guard: all fees must have an ID (otherwise the API will reject)
    const missingId = vehicleFees.find(f => f.id === null);
    if (missingId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Fee Configuration Error',
        detail: `Could not resolve ID for ${missingId.feeName} (${missingId.dayType}). Please refresh and try again.`,
        life: 5000
      });
      return;
    }

    const payload: UpdateVehiclePayload = {
      id: this.vehicleId,
      entityId: this.entityId,
      investorNumber: this.investorNumber.trim(),
      otpApproverNumber: this.marshalNumber.trim(),
      fleetNumber: this.fleetNumber.trim().replace(/\s+/g, ''),
      registrationNumber: this.registrationNumber.trim(),
      capacity: this.capacity!,
      stageId: this.selectedStage!,
      maintainFees: true,
      vehicleFees,
      username: this.username,
      storeNumber: this.storeNumber.trim() ? this.storeNumber.trim() : undefined,
      tillNumber: this.tillNumber.trim() ? this.tillNumber.trim() : undefined
    };

    console.log('Updating vehicle with payload:', payload);

    this.submitting = true;
    this.loadingStore.start();

    this.dataService.post<ApiResponse>(API_ENDPOINTS.UPDATE_VEHICLE, payload, 'update-vehicle', true)
      .subscribe({
        next: (response) => {
          this.submitting = false;
          this.loadingStore.stop();

          if (response.status === 0) {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: response.message || 'Vehicle updated successfully', life: 4000 });
            setTimeout(() => this.router.navigate(['/vehicles/all']), 1500);
          } else {
            console.log('An error occurred', response);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message, life: 5000 });
          }
        },
        error: (err) => {
          let msg = 'Failed to update vehicle';
          if (err.status === 409) msg = 'Vehicle with this registration number already exists';
          else if (err.status === 400) msg = err.error?.message || 'Invalid data provided.';
          else if (err.status === 404) msg = 'Vehicle not found';
          else if (err.status === 500) msg = 'Server error. Please try again later.';
          else if (err.error?.message) msg = err.error.message;

          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
          this.submitting = false;
          this.loadingStore.stop();
        }
      });
  }

  onCancel(): void { this.router.navigate(['/vehicles/all']); }

  // ── State helpers ─────────────────────────────────────────────────────────

  private getVehicleFromState(): VehicleState | null {
    try {
      const nav = this.router.getCurrentNavigation();
      if (nav?.extras?.state?.['vehicle']) {
        const v = nav.extras.state['vehicle'] as VehicleState;
        if (this.isValidVehicle(v)) return v;
      }
      if (window.history.state?.vehicle) {
        const v = window.history.state.vehicle as VehicleState;
        if (this.isValidVehicle(v)) return v;
      }
      return null;
    } catch { return null; }
  }

  private isValidVehicle(v: any): boolean {
    return !!(v && v.id && v.entityId && v.investorNumber && v.marshalNumber && v.fleetNumber && v.registrationNumber && v.capacity && v.stageId);
  }

  private handleVehicleNotFound(id: string): void {
    this.messageService.add({ severity: 'warn', summary: 'Warning', detail: `Vehicle ${id} not found`, life: 4000 });
    setTimeout(() => this.router.navigate(['/vehicles/all']), 2000);
  }
}
