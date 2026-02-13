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

/**
 * A resolved fee row the template iterates over.
 * One entry per category, EXCEPT OFFLOAD which expands to three.
 */
export interface FeeRow {
  /** Display label shown to the user */
  label: string;
  /** Internal model key used to read / write the numeric value */
  modelKey: FeeModelKey;
  /** feeName sent to the API  */
  feeName: string;
  /** dayType sent to the API  */
  dayType: string;
  /** Icon class (PrimeIcons) */
  icon: string;
  /** Soft hint shown below the input */
  hint?: string;
}

/**
 * All possible keys on this component that hold a fee amount.
 * Keeping them explicit makes the template type-safe.
 */
export type FeeModelKey =
  | 'systemFeeAmount'
  | 'managementFeeAmount'
  | 'saccoFeeAmount'
  | 'offloadWeekdayFeeAmount'
  | 'offloadSaturdayFeeAmount'
  | 'offloadSundayFeeAmount'
  | 'driverFeeAmount';

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

  // ── Fee amount holders (one per possible fee type) ───────────────────────
  systemFeeAmount: number | null = null;
  managementFeeAmount: number | null = null;
  saccoFeeAmount: number | null = null;
  offloadWeekdayFeeAmount: number | null = null;
  offloadSaturdayFeeAmount: number | null = null;
  offloadSundayFeeAmount: number | null = null;
  driverFeeAmount: number | null = null;

  /**
   * The ordered list of fee rows the template renders.
   * Built from organizationCategoryFees once the org is loaded.
   */
  feeRows: FeeRow[] = [];

  // ── Dropdown options ─────────────────────────────────────────────────────
  investorOptions: DropdownOption[] = [];
  marshalOptions: DropdownOption[] = [];
  stageOptions: DropdownOption[] = [];

  // ── Loading states ───────────────────────────────────────────────────────
  investorsLoading: boolean = false;
  marshalsLoading: boolean = false;
  stagesLoading: boolean = false;
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

  get loading() { return this.loadingStore.loading; }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.entityId = user.entityId;
    this.username = user.username || user.email;
    this.loadInitialData();
  }

  // ── Data loading ─────────────────────────────────────────────────────────

  private loadInitialData(): void {
    if (!this.entityId) return;
    this.loadingStore.start();

    forkJoin({
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
    }).subscribe({
      next: (results) => {
        this.investorOptions = results.investors.data.map((u: User) => ({
          label: `${u.firstName} ${u.lastName} - ${u.username}`,
          value: u.phoneNumber,
        }));

        this.marshalOptions = results.marshals.data.map((u: User) => ({
          label: `${u.firstName} ${u.lastName} - ${u.username}`,
          value: u.phoneNumber,
        }));

        this.stageOptions = results.stages.data.map((s: Stage) => ({
          label: s.name,
          value: s.id,
        }));

        if (results.organization.data?.length) {
          this.organization = results.organization.data[0];
          this.buildFeeRows();
          this.prefillFeeDefaults();
        } else {
          console.warn('No organization data found — fee fields will be empty');
          this.buildFeeRows(); // build with no org = empty rows fallback
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

  // ── Fee row construction ──────────────────────────────────────────────────

  /**
   * Builds `feeRows` from whatever categories the organisation has configured.
   * OFFLOAD is always expanded into three day-type rows.
   */
  buildFeeRows(): void {
    const categories = this.organization?.organizationCategoryFees ?? [];

    // Sort by priority so the order matches the backend definition
    const sorted = [...categories].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

    const rows: FeeRow[] = [];

    for (const cat of sorted) {
      switch (cat.categoryName) {
        case 'SYSTEM':
          rows.push({
            label: 'System Fee',
            modelKey: 'systemFeeAmount',
            feeName: 'SYSTEM',
            dayType: 'ALL',
            icon: 'pi-cog',
            hint: 'Platform transaction fee'
          });
          break;

        case 'MANAGEMENT':
          rows.push({
            label: 'Management Fee',
            modelKey: 'managementFeeAmount',
            feeName: 'MANAGEMENT',
            dayType: 'ALL',
            icon: 'pi-briefcase',
            hint: 'Organisation management fee'
          });
          break;

        case 'SACCO':
          rows.push({
            label: 'SACCO Fee',
            modelKey: 'saccoFeeAmount',
            feeName: 'SACCO',
            dayType: 'ALL',
            icon: 'pi-building',
            hint: 'SACCO contribution'
          });
          break;

        case 'OFFLOAD':
          // Always expand OFFLOAD into three day-type rows
          rows.push(
            {
              label: 'Offload Fee – Weekday',
              modelKey: 'offloadWeekdayFeeAmount',
              feeName: 'OFFLOAD',
              dayType: 'WEEKDAY',
              icon: 'pi-calendar',
              hint: 'Monday – Friday'
            },
            {
              label: 'Offload Fee – Saturday',
              modelKey: 'offloadSaturdayFeeAmount',
              feeName: 'OFFLOAD',
              dayType: 'SATURDAY',
              icon: 'pi-calendar',
              hint: 'Saturday rate'
            },
            {
              label: 'Offload Fee – Sunday',
              modelKey: 'offloadSundayFeeAmount',
              feeName: 'OFFLOAD',
              dayType: 'SUNDAY',
              icon: 'pi-calendar',
              hint: 'Sunday / public holiday rate'
            }
          );
          break;

        case 'DRIVER':
          rows.push({
            label: 'Driver Fee',
            modelKey: 'driverFeeAmount',
            feeName: 'DRIVER',
            dayType: 'ALL',
            icon: 'pi-user',
            hint: 'Driver incentive fee'
          });
          break;

        default:
          console.warn(`Unknown fee category: ${cat.categoryName}`);
          break;
      }
    }

    this.feeRows = rows;
  }

  /**
   * Pre-fills each fee amount from `organizationCategoryFees`.
   * Uses 0 when feeAmount is null (backend sometimes sends null for unconfigured fees).
   */
  prefillFeeDefaults(): void {
    const cats = this.organization?.organizationCategoryFees ?? [];

    const get = (name: string): number => {
      const found = cats.find(c => c.categoryName === name);
      return found?.feeAmount ?? 0;
    };

    if (this.hasCategory('SYSTEM')) this.systemFeeAmount = get('SYSTEM');
    if (this.hasCategory('MANAGEMENT')) this.managementFeeAmount = get('MANAGEMENT');
    if (this.hasCategory('SACCO')) this.saccoFeeAmount = get('SACCO');
    if (this.hasCategory('DRIVER')) this.driverFeeAmount = get('DRIVER');

    if (this.hasCategory('OFFLOAD')) {
      const base = get('OFFLOAD');
      this.offloadWeekdayFeeAmount = base;
      this.offloadSaturdayFeeAmount = base;
      this.offloadSundayFeeAmount = base;
    }
  }

  /** Returns true if this entity's org has the given category configured */
  hasCategory(name: string): boolean {
    return (this.organization?.organizationCategoryFees ?? [])
      .some(c => c.categoryName === name);
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  /** Used by [(ngModel)] in the template to bind fee amounts dynamically */
  getFeeValue(key: FeeModelKey): number | null {
    return (this as any)[key] as number | null;
  }

  setFeeValue(key: FeeModelKey, value: number | null): void {
    (this as any)[key] = value;
  }

  // ── Validation ────────────────────────────────────────────────────────────

  isFormValid(): boolean {
    const basicValid = !!(
      this.investorNumber.trim() &&
      this.marshalNumber.trim() &&
      this.fleetNumber.trim() &&
      this.registrationNumber.trim() &&
      this.capacity && this.capacity > 0 &&
      this.selectedStage
    );

    if (!basicValid) return false;

    // Every fee row that exists must have a non-negative value
    return this.feeRows.every(row => {
      const val = this.getFeeValue(row.modelKey);
      return val !== null && val >= 0;
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────

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

    // Build vehicleFees from feeRows — only the categories that exist for this entity
    const vehicleFees: VehicleFee[] = this.feeRows.map(row => ({
      id: '',
      feeName: row.feeName,
      dayType: row.dayType,
      feeAmount: this.getFeeValue(row.modelKey) ?? 0,
      username: this.username!,
      entityId: this.entityId!,
    }));

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
      vehicleFees,
      username: this.username
    };

    if (this.storeNumber.trim()) payload.storeNumber = this.storeNumber.trim();
    if (this.tillNumber.trim()) payload.tillNumber = this.tillNumber.trim();

    console.log('Creating vehicle with payload:', payload);

    this.submitting = true;
    this.loadingStore.start();

    this.dataService.post<ApiResponse>(API_ENDPOINTS.CREATE_VEHICLE, payload, 'create-vehicle')
      .subscribe({
        next: (response) => {
          this.submitting = false;
          this.loadingStore.stop();

          if (response.status === 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message || 'Vehicle created successfully',
              life: 4000
            });
            setTimeout(() => this.router.navigate(['/vehicles/all']), 1500);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.message || 'Failed to create vehicle',
              life: 5000
            });
          }
        },
        error: (err) => {
          let msg = 'Failed to create vehicle';
          if (err.status === 409) msg = 'Vehicle with this registration/fleet number already exists';
          else if (err.status === 400) msg = err.error?.message || 'Invalid data provided.';
          else if (err.status === 500) msg = 'Server error. Please try again later.';
          else if (err.error?.message) msg = err.error.message;

          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
          this.submitting = false;
          this.loadingStore.stop();
          this.cdr.detectChanges();
        }
      });
  }

  onCancel(): void { this.router.navigate(['/vehicles/all']); }

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
    this.prefillFeeDefaults();
  }
}
