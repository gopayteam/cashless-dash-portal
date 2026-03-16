// pages/payment-request/payment-request.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../@core/services/auth.service';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface EntityConfig {
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  cssClass: string;
}

export interface PaymentPayload {
  phoneNumber: string;
  amount: string;
  fleetNumber: string;
  username: string;
  tripId: number;
  bookingType: 'NOW' | 'SCHEDULED';
  paymentSource: string;
  entityId: string;
  paymentType: string;
  paymentFor: string;
}

export interface Vehicle {
  id: number;
  createdOn: string;
  createBy: string;
  lastModifiedDate: string | null;
  modifiedBy: string | null;
  softDelete: boolean;
  created: boolean;
  entityId: string;
  entityName: string;
  fleetCode: string;
  registrationNumber: string;
  storeNumber: string;
  tillNumber: string;
  fleetNumber: string;
  capacity: number;
  seatedCapacity: number;
  standingCapacity: number;
  otpApproverNumber: string | null;
  investorNumber: string;
  marshalNumber: string;
  organizationFeesMaintained: boolean;
  status: string;
  stageId: number;
  stageName: string;
}

export interface VehicleApiResponse {
  status: number;
  message: string;
  data: Vehicle[];
  totalRecords: number;
}

export interface stkData {
  merchantId: string;
  checkoutId: string;

}
export interface PaymentApiResponse {
  status: number;
  message: string;
  data: stkData;
}

export type ViewState = 'form' | 'success' | 'error';

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-payment-request',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    SelectModule,
    TooltipModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './payment-request.html',
  styleUrls: ['./payment-request.css'],
  providers: [MessageService],
})
export class PaymentRequestComponent implements OnInit {

  scheduleEnabled = false;

  // ── Entity config ─────────────────────────────────────────────────
  entityId: string | null = null;
  entityConfig!: EntityConfig;

  readonly ENTITY_CONFIGS: Record<string, EntityConfig> = {
    GS000002: {
      name: 'Super Metro',
      tagline: 'The easy way!',
      primaryColor: '#1a3a6b',
      secondaryColor: '#d42b2b',
      cssClass: 'entity-super-metro',
    },
    GS000006: {
      name: 'Bungoma Line',
      tagline: 'Connecting Bungoma · Reliable',
      primaryColor: '#1a3a6b', // '#b91c1c',
      secondaryColor: '#d42b2b', //'#f59e0b',
      cssClass: 'entity-bungoma-line',
    },
  };

  // ── Form fields ───────────────────────────────────────────────────
  phoneNumber = '';

  /**
   * Used when the fleet is pre-filled via QR code route/query param.
   * Displayed as a read-only locked badge instead of the dropdown.
   */
  lockedFleetNumber = '';
  fleetLockedFromQr = false;

  /**
   * Used when the user manually selects from the vehicle dropdown.
   */
  selectedVehicle: Vehicle | null = null;

  tripId: number | null = null;
  amount: number | null = null;
  bookingType: 'NOW' | 'SCHEDULED' = 'NOW';

  // ── Vehicle list ──────────────────────────────────────────────────
  vehicles: Vehicle[] = [];
  vehicleOptions: { label: string; value: Vehicle }[] = [];
  vehiclesLoading = false;
  vehiclesLoadError = false;

  // ── Validation ────────────────────────────────────────────────────
  touchedPhone = false;
  touchedFleet = false;
  touchedTrip = false;
  touchedAmt = false;

  // ── UI State ──────────────────────────────────────────────────────
  viewState: ViewState = 'form';
  successMessage = '';
  errorMessage = '';

  get loading() {
    return this.loadingStore.loading;
  }

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) { }

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit(): void {

    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId
    } else {
      this.router.navigate(['/login']);
      console.log('No user logged in');
    }

    // 1. Resolve entityId from route param → query param → default
    const paramEntityId =
      this.route.snapshot.paramMap.get('entityId') ||
      this.route.snapshot.queryParamMap.get('entityId');

    if (paramEntityId) this.entityId = paramEntityId;

    if (this.entityId)
      this.entityConfig =
        this.ENTITY_CONFIGS[this.entityId] ?? this.ENTITY_CONFIGS['GS000006'];

    this.applyEntityTheme();

    // 2. Resolve fleetNumber from route param → query param (QR code flow)
    const paramFleet =
      this.route.snapshot.paramMap.get('fleetNumber') ||
      this.route.snapshot.queryParamMap.get('fleetNumber');

    if (paramFleet && paramFleet.trim()) {
      this.lockedFleetNumber = paramFleet.trim().toUpperCase();
      this.fleetLockedFromQr = true;
    }

    // 3. Pre-fill tripId if provided (also useful for QR deep-links)
    const paramTrip =
      this.route.snapshot.paramMap.get('tripId') ||
      this.route.snapshot.queryParamMap.get('tripId');

    if (paramTrip && !isNaN(Number(paramTrip))) {
      this.tripId = Number(paramTrip);
    }

    // 4. Only fetch vehicles list when fleet is NOT locked via QR
    if (!this.fleetLockedFromQr) {
      this.fetchVehicles(false);
    }
  }

  // ── Apply entity CSS class + CSS variables ────────────────────────
  private applyEntityTheme(): void {
    // Remove any stale entity class
    document.body.classList.forEach(cls => {
      if (cls.startsWith('entity-')) document.body.classList.remove(cls);
    });
    document.body.classList.add(this.entityConfig.cssClass);

    // Write CSS variables so the stylesheet can pick them up
    const root = document.documentElement;
    root.style.setProperty('--entity-primary', this.entityConfig.primaryColor);
    root.style.setProperty('--entity-secondary', this.entityConfig.secondaryColor);
  }

  // ── Vehicle fetch ─────────────────────────────────────────────────
  fetchVehicles(bypassCache: boolean, $event?: any): void {
    const event = $event || { first: 0, rows: 200 };
    const page = event.first / event.rows;
    const pageSize = event.rows;

    const payload = {
      entityId: this.entityId,
      page,
      size: pageSize,
    };

    this.vehiclesLoading = true;
    this.vehiclesLoadError = false;

    this.dataService
      .post<VehicleApiResponse>(API_ENDPOINTS.ALL_VEHICLES, payload, 'vehicles', bypassCache)
      .subscribe({
        next: (response) => {
          // Only show ACTIVE vehicles
          this.vehicles = response.data.filter(v => v.status === 'ACTIVE');
          this.vehicleOptions = this.vehicles.map(v => ({
            label: `${v.fleetNumber}  ·  ${v.registrationNumber}  (${v.stageName})`,
            value: v,
          }));
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load vehicles', err);
          this.vehiclesLoadError = true;
          this.messageService.add({
            severity: 'warn',
            summary: 'Vehicles unavailable',
            detail: 'Could not load fleet list. Type your fleet number manually.',
            life: 5000,
          });
          this.cdr.detectChanges();
        },
        complete: () => {
          this.vehiclesLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  retryLoadVehicles(): void {
    this.fetchVehicles(true);
  }

  // ── Computed: effective fleet number ──────────────────────────────
  get effectiveFleetNumber(): string {
    if (this.fleetLockedFromQr) return this.lockedFleetNumber;
    return this.selectedVehicle?.fleetNumber ?? '';
  }

  // ── Validation getters ────────────────────────────────────────────
  get phoneValid(): boolean {
    return /^(07|01)\d{8}$/.test(this.phoneNumber.replace(/\s+/g, ''));
  }

  get fleetValid(): boolean {
    return this.effectiveFleetNumber.trim().length > 0;
  }

  get tripValid(): boolean {
    return this.tripId !== null && this.tripId > 0;
  }

  get amountValid(): boolean {
    return this.amount !== null && this.amount >= 1;
  }

  get formValid(): boolean {
    return this.phoneValid && this.fleetValid && this.tripValid && this.amountValid;
  }

  get phoneErrorMsg(): string {
    if (!this.touchedPhone) return '';
    if (!this.phoneNumber) return 'Phone number is required';
    if (!this.phoneValid) return 'Enter a valid Kenyan number (07xx / 01xx)';
    return '';
  }

  get fleetErrorMsg(): string {
    if (!this.touchedFleet) return '';
    if (!this.fleetValid) return 'Please select a fleet vehicle';
    return '';
  }

  get tripErrorMsg(): string {
    if (!this.touchedTrip) return '';
    if (!this.tripValid) return 'Enter a valid trip ID (must be > 0)';
    return '';
  }

  get amountErrorMsg(): string {
    if (!this.touchedAmt) return '';
    if (!this.amountValid) return 'Minimum amount is KES 1';
    return '';
  }

  // ── Booking type toggle ───────────────────────────────────────────
  setBookingType(type: 'NOW' | 'SCHEDULED'): void {
    this.bookingType = type;
  }

  // ── Submit ────────────────────────────────────────────────────────
  submitPayment(): void {
    this.touchedPhone = true;
    this.touchedFleet = true;
    this.touchedTrip = true;
    this.touchedAmt = true;

    if (!this.formValid || this.loading()) return;

    const phone = this.phoneNumber.replace(/\s+/g, '');
    const fleet = this.effectiveFleetNumber.toUpperCase();

    const payload: PaymentPayload = {
      phoneNumber: phone,
      amount: String(this.amount),
      fleetNumber: fleet,
      username: phone,
      tripId: this.tripId!,
      bookingType: this.bookingType,
      paymentSource: 'APP_BOOKING',
      entityId: this.entityId!,
      paymentType: 'PROMPT',
      paymentFor: 'FARE',
    };

    this.loadingStore.start();

    this.dataService
      .post<PaymentApiResponse>(API_ENDPOINTS.PAYMENT_REQUEST, payload, 'payment', false)
      .subscribe({
        next: () => {
          this.successMessage =
            `An M-Pesa prompt has been sent to ${phone}.` +
            `Enter your PIN to complete the KES ${Number(this.amount).toLocaleString()} payment.`;
          this.viewState = 'success';
          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.message || err?.message || 'Something went wrong. Please try again.';
          this.viewState = 'error';
          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        complete: () => this.loadingStore.stop(),
      });
  }

  // ── Reset form ────────────────────────────────────────────────────
  resetForm(): void {
    this.phoneNumber = '';
    this.amount = null;
    this.tripId = null;
    this.bookingType = 'NOW';
    this.touchedPhone = false;
    this.touchedFleet = false;
    this.touchedTrip = false;
    this.touchedAmt = false;
    this.viewState = 'form';
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.fleetLockedFromQr) {
      this.selectedVehicle = null;
    }
  }
}
