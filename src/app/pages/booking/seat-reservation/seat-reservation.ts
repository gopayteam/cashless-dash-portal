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
  /** Can be injected from a parent or read from route params */
  @Input() tripId: number | null = null;

  entityId: string | null = null;

  reservations: SeatReservation[] = [];
  allReservations: SeatReservation[] = [];
  filteredReservations: SeatReservation[] = [];

  // Pagination
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  // Filters
  searchTerm: string = '';
  selectedStatus: string = '';
  usernameFilter: string = '';

  // Detail dialog
  displayDetailDialog: boolean = false;
  selectedReservation: SeatReservation | null = null;

  // Summary stats
  totalReservations: number = 0;
  completedCount: number = 0;
  pendingCount: number = 0;
  failedCount: number = 0;
  totalSeatsReserved: number = 0;

  reservationStatusOptions: ReservationStatusOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Failed', value: 'FAILED' },
  ];

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

    // Try route param if @Input not provided
    if (!this.tripId) {
      const paramId = this.route.snapshot.paramMap.get('tripId');
      if (paramId) {
        this.tripId = parseInt(paramId, 10);
      }
    }

    if (!this.tripId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No Trip ID provided.',
        life: 5000,
      });
      return;
    }

    this.loadReservations();
  }

  private lastEvent: any;

  // ── Data loading ──────────────────────────────────────────────────────────

  loadReservations($event?: any): void {
    this.lastEvent = $event;
    this.fetchReservations(false, $event)
  }

  fetchReservations(bypassCache: boolean, $event?: any): void {
    if (!this.tripId || !this.entityId) return;

    if ($event) {
      this.first = $event.first;
      this.rows = $event.rows;
    }

    const payload: Record<string, any> = {
      tripId: this.tripId,
      entityId: this.entityId,
    };

    // Optional filters
    if (this.usernameFilter.trim()) {
      payload['username'] = this.usernameFilter.trim();
    }
    if (this.selectedStatus) {
      payload['reservationStatus'] = this.selectedStatus;
    }

    this.loadingStore.start();

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
    this.completedCount = this.allReservations.filter(
      (r) => r.reservationStatus === 'COMPLETED'
    ).length;
    this.pendingCount = this.allReservations.filter(
      (r) => r.reservationStatus === 'PENDING'
    ).length;
    this.failedCount = this.allReservations.filter(
      (r) => r.reservationStatus === 'FAILED'
    ).length;
    this.totalSeatsReserved = this.allReservations.reduce(
      (sum, r) => sum + (r.seatsReserved ?? 0),
      0
    );
  }

  applyClientSideFilter(): void {
    let filtered = [...this.allReservations];

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

    if (this.selectedStatus) {
      filtered = filtered.filter(
        (r) => r.reservationStatus === this.selectedStatus
      );
    }

    this.filteredReservations = filtered;

    // Client-side page slice
    const start = this.first;
    const end = start + this.rows;
    this.reservations = filtered.slice(start, end);
  }

  onSearchChange(): void {
    this.first = 0;
    this.applyClientSideFilter();
  }

  onStatusChange(): void {
    // Server-side filter — reload with the new status in payload
    this.first = 0;
    this.loadReservations();
  }

  onUsernameFilterChange(): void {
    // Server-side filter — reload with new username in payload
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
    // Simple colour cycling for visual variety
    const colours = ['chip-purple', 'chip-blue', 'chip-green', 'chip-orange', 'chip-pink'];
    return colours[seatNumber % colours.length];
  }

  getUserInitial(username: string): string {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  }
}
