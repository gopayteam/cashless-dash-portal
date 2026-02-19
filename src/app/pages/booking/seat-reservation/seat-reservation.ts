// pages/trips/seat-reservations/seat-reservations.ts
import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Paginator } from 'primeng/paginator';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

// ── Models ────────────────────────────────────────────────────────────────────

export type ReservationStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface SeatReservation {
  id: number;
  softDelete: boolean;
  entityId: string;
  username: string;
  tripId: number;
  seatsReserved: number;
  reservationStatus: ReservationStatus;
  seatNumbers: number[];
}

export interface SeatReservationsApiResponse {
  status: number;
  message: string;
  data: SeatReservation[];
  totalRecords: number;
}

interface ReservationStatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-seat-reservations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    MessageModule,
    ToastModule,
    Paginator,
  ],
  templateUrl: './seat-reservation.html',
  styleUrls: ['./seat-reservation.css', '../../../../styles/global/_toast.css'],
  providers: [MessageService],
})
export class SeatReservationsComponent implements OnInit {
  onUsernameFilterChange() {
    throw new Error('Method not implemented.');
  }
  /** Optional @Input — when embedding this component inside a parent */
  @Input() tripId: number | null = null;

  entityId: string | null = null;

  reservations: SeatReservation[] = [];
  allReservations: SeatReservation[] = [];
  filteredReservations: SeatReservation[] = [];

  // Pagination
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  // ── Optional server-side filter fields (username = phone number) ────────────
  /**
   * When populated, this is sent in the POST body as `username`.
   * The API notes say it is the phone number of the user.
   * Only applied when the user has typed something and pressed Search / Enter.
   */
  usernameFilter: string = '';

  /**
   * When populated, sent as `reservationStatus` in the POST body.
   * Only applied when the user picks from the dropdown.
   */
  selectedStatus: string = '';

  // Client-side keyword search (does NOT trigger a server call)
  searchTerm: string = '';

  // Detail dialog
  displayDetailDialog: boolean = false;
  selectedReservation: SeatReservation | null = null;

  // Summary stats
  totalReservations: number = 0;
  completedCount: number = 0;
  pendingCount: number = 0;
  failedCount: number = 0;
  totalSeatsReserved: number = 0;

  /** True once a valid tripId has been resolved and first fetch has been triggered */
  hasLoaded: boolean = false;

  /** Human-readable message shown when no tripId is available */
  noTripIdMessage: string = '';

  reservationStatusOptions: ReservationStatusOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Failed', value: 'FAILED' },
  ];

  private lastEvent: any;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  get loading(): boolean {
    return this.loadingStore.loading();
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId;
    } else {
      this.router.navigate(['/login']);
      return;
    }

    // 1. @Input() from a parent component
    // 2. Router navigation state  (passed via router.navigate state)
    // 3. Route param :tripId
    // 4. Nothing found → show prompt, do NOT fetch
    if (!this.tripId) {
      const navState =
        this.router.getCurrentNavigation()?.extras?.state ?? history.state;
      if (navState?.['tripId']) {
        this.tripId = Number(navState['tripId']);
      }
    }

    if (!this.tripId) {
      const paramId = this.route.snapshot.paramMap.get('tripId');
      if (paramId) {
        this.tripId = parseInt(paramId, 10);
      }
    }

    if (this.tripId) {
      this.loadReservations();
    } else {
      this.noTripIdMessage =
        'No Trip ID was provided. Navigate here from a trip row to view its seat reservations.';
    }
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadReservations($event?: any): void {
    this.lastEvent = $event;
    this.fetchReservations(false, $event);
  }

  fetchReservations(bypassCache: boolean, $event?: any): void {
    if (!this.tripId || !this.entityId) return;

    if ($event) {
      this.first = $event.first;
      this.rows = $event.rows;
    }

    // Build payload — username and reservationStatus are optional
    const payload: Record<string, any> = {
      tripId: this.tripId,
      entityId: this.entityId,
    };

    if (this.usernameFilter.trim()) {
      payload['username'] = this.usernameFilter.trim();
    }

    if (this.selectedStatus) {
      payload['reservationStatus'] = this.selectedStatus;
    }

    this.loadingStore.start();
    this.hasLoaded = true;

    this.dataService
      .post<SeatReservationsApiResponse>(
        API_ENDPOINTS.SEAT_RESERVATIONS,
        payload,
        'seat-reservations',
        bypassCache
      )
      .subscribe({
        next: (response) => {
          this.allReservations = response.data;
          this.totalRecords = response.totalRecords;
          this.calculateStats();
          this.applyClientSideFilter();
          setTimeout(() => this.cdr.detectChanges());
        },
        error: (err) => {
          console.error('Failed to load seat reservations', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load seat reservations. Please try again.',
            life: 5000,
          });
        },
        complete: () => this.loadingStore.stop(),
      });
  }

  onPageChange(event: any): void {
    this.loadReservations(event);
  }

  calculateStats(): void {
    this.totalReservations = this.allReservations.length;
    this.completedCount = this.allReservations.filter((r) => r.reservationStatus === 'COMPLETED').length;
    this.pendingCount = this.allReservations.filter((r) => r.reservationStatus === 'PENDING').length;
    this.failedCount = this.allReservations.filter((r) => r.reservationStatus === 'FAILED').length;
    this.totalSeatsReserved = this.allReservations.reduce((s, r) => s + (r.seatsReserved ?? 0), 0);
  }

  applyClientSideFilter(): void {
    let filtered = [...this.allReservations];

    // Client-side keyword search only — does NOT re-fetch
    if (this.searchTerm.trim()) {
      const lower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.username?.toLowerCase().includes(lower) ||
          String(r.id).includes(lower) ||
          String(r.tripId).includes(lower) ||
          r.seatNumbers?.some((s) => String(s).includes(lower))
      );
    }

    this.filteredReservations = filtered;

    // Client-side page slice
    const start = this.first;
    const end = start + this.rows;
    this.reservations = filtered.slice(start, end);
  }

  /** Client-side keyword search — no server call */
  onSearchChange(): void {
    this.first = 0;
    this.applyClientSideFilter();
  }

  /**
   * Reservation status changed — re-fetch from server with updated payload.
   * This is a server-side filter, so it always triggers a new request.
   */
  onStatusChange(): void {
    this.first = 0;
    this.loadReservations();
  }

  /**
   * Username (phone number) filter applied via the search button or Enter key.
   * Server-side — re-fetches with the username in the payload.
   */
  applyUsernameFilter(): void {
    this.first = 0;
    this.loadReservations();
  }

  /** Clear the username filter and reload */
  clearUsernameFilter(): void {
    this.usernameFilter = '';
    this.first = 0;
    this.loadReservations();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyClientSideFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.usernameFilter = '';
    this.first = 0;
    this.loadReservations();
  }

  refresh(): void {
    if (this.lastEvent) {
      this.fetchReservations(true, this.lastEvent);
    } else {
      this.fetchReservations(true, { first: 0, rows: this.rows });
    }
  }

  goBack(): void {
    this.router.navigate(['/booking/all-trips']);
  }

  // ── Detail dialog ─────────────────────────────────────────────────────────

  viewReservationDetails(reservation: SeatReservation): void {
    this.selectedReservation = reservation;
    this.displayDetailDialog = true;
    setTimeout(() => this.cdr.detectChanges());
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedReservation = null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'complete',
      PENDING: 'warning',
      FAILED: 'rejected',
    };
    return map[status] ?? 'default';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'pi pi-check-circle',
      PENDING: 'pi pi-clock',
      FAILED: 'pi pi-times-circle',
    };
    return map[status] ?? 'pi pi-circle';
  }

  getSeatChipClass(seatNumber: number): string {
    const colours = ['chip-purple', 'chip-blue', 'chip-green', 'chip-orange', 'chip-pink'];
    return colours[seatNumber % colours.length];
  }

  getUserInitial(username: string): string {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  }
}
