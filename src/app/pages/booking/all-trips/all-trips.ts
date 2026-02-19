// pages/trips/all-trips/all-trips.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { Router } from '@angular/router';

// ── Models ────────────────────────────────────────────────────────────────────

export type TripStatus = 'COMPLETE' | 'PENDING' | 'IN_PROGRESS';
export type TripType = 'SCHEDULE' | 'CHARTER' | string;

export interface Trip {
  tripId: number;
  fleetNumber: string;
  route: number;
  routeName: string;
  tripType: TripType;
  availableSeats: number;
  capacity: number;
  tripStatus: TripStatus;
  travelDate: string;
  travelTime: string;
  tripAmount: string;
}

export interface TripListApiResponse {
  status: number;
  message: string;
  data: Trip[];
  totalRecords: number;
}

interface TripStatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-all-trips',
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
  templateUrl: './all-trips.html',
  styleUrls: ['./all-trips.css', '../../../../styles/global/_toast.css'],
  providers: [MessageService],
})
export class AllTripsComponent implements OnInit {
  entityId: string | null = null;

  trips: Trip[] = [];
  allTrips: Trip[] = [];
  filteredTrips: Trip[] = [];

  // Pagination
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  // Filters
  searchTerm: string = '';
  selectedTripStatus: string = '';
  fleetNumberFilter: string = '';

  // Detail dialog
  displayDetailDialog: boolean = false;
  selectedTrip: Trip | null = null;

  // Summary stats
  totalTrips: number = 0;
  completeTrips: number = 0;
  pendingTrips: number = 0;
  inProgressTrips: number = 0;

  tripStatusOptions: TripStatusOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Complete', value: 'COMPLETE' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
  ];

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private messageService: MessageService,
    private router: Router,
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
    this.loadTrips();
  }

  private lastEvent: any;

  // ── Data loading ──────────────────────────────────────────────────────────

  loadTrips($event?: any): void {
    this.lastEvent = $event;
    this.fetchTrips(false, $event)
  }

  fetchTrips(bypassCache: boolean, $event?: any): void {
    let page = 0;
    let pageSize = this.rows;

    if ($event) {
      page = $event.first / $event.rows;
      pageSize = $event.rows;
      this.first = $event.first;
      this.rows = $event.rows;
    }

    // Build query params
    const params: any = {
      entityId: this.entityId!,
      tripStatus: String('COMPLETE'),
      page: String(page),
      size: String(pageSize),
    };

    if (this.selectedTripStatus) {
      params.tripStatus = this.selectedTripStatus;
    }
    if (this.fleetNumberFilter.trim()) {
      params['fleetNumber'] = this.fleetNumberFilter.trim();
    }

    // const queryString = new URLSearchParams(params).toString();
    // const url = `${API_ENDPOINTS.ALL_TRIPS}?${queryString}`;

    this.loadingStore.start();

    this.dataService
      .get<TripListApiResponse>(API_ENDPOINTS.ALL_TRIPS, params, 'all-trips', bypassCache)
      .subscribe({
        next: (response) => {
          this.allTrips = response.data;
          this.totalRecords = response.totalRecords;
          this.calculateStats();
          this.applyClientSideFilter();
          setTimeout(() => this.cdr.detectChanges());
        },
        error: (err) => {
          console.error('Failed to load trips', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load trips. Please try again.',
            life: 5000,
          });
        },
        complete: () => this.loadingStore.stop(),
      });
  }

  onPageChange(event: any): void {
    this.loadTrips(event);
  }

  calculateStats(): void {
    this.totalTrips = this.totalRecords;
    this.completeTrips = this.allTrips.filter(
      (t) => t.tripStatus === 'COMPLETE'
    ).length;
    this.pendingTrips = this.allTrips.filter(
      (t) => t.tripStatus === 'PENDING'
    ).length;
    this.inProgressTrips = this.allTrips.filter(
      (t) => t.tripStatus === 'IN_PROGRESS'
    ).length;
  }

  applyClientSideFilter(): void {
    let filtered = [...this.allTrips];

    if (this.searchTerm.trim()) {
      const lower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.fleetNumber?.toLowerCase().includes(lower) ||
          t.routeName?.toLowerCase().includes(lower) ||
          t.tripType?.toLowerCase().includes(lower) ||
          String(t.tripId).includes(lower) ||
          String(t.route).includes(lower)
      );
    }

    if (this.selectedTripStatus) {
      filtered = filtered.filter((t) => t.tripStatus === this.selectedTripStatus);
    }

    this.filteredTrips = filtered;
    this.trips = filtered;
  }

  onSearchChange(): void {
    this.applyClientSideFilter();
  }

  onTripStatusChange(): void {
    this.loadTrips();
  }

  onFleetFilterChange(): void {
    this.loadTrips();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyClientSideFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedTripStatus = '';
    this.fleetNumberFilter = '';
    this.loadTrips();
  }

  refresh(): void {
    if (this.lastEvent) {
      this.fetchTrips(true, this.lastEvent);
    } else {
      this.fetchTrips(true, { first: 0, rows: this.rows });
    }
  }

  // ── Detail dialog ─────────────────────────────────────────────────────────

  viewTripDetails(trip: Trip): void {
    this.selectedTrip = trip;
    this.displayDetailDialog = true;
    setTimeout(() => this.cdr.detectChanges());
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedTrip = null;
  }

  viewTransactions(trip: Trip, event?: Event): void {
    event?.stopPropagation();

    if (!trip?.tripId) {
      console.error('Trip ID missing', trip);
      return;
    }

    // console.log('Navigating to update admin:', admin.id);
    // console.log('Admin data being passed:', admin);

    // Pass the complete user object through router state
    // This ensures the data is immediately available in the update component
    this.router.navigate(['/booking/trip-transactions', trip.tripId], {
      state: {
        tripId: trip.tripId,
        // Add timestamp to ensure fresh state
        timestamp: Date.now()
      }
    });
  }

  viewReservations(trip: Trip, event?: Event): void {
    event?.stopPropagation();

    if (!trip?.tripId) {
      console.error('Trip ID missing', trip);
      return;
    }

    // console.log('Navigating to update admin:', admin.id);
    // console.log('Admin data being passed:', admin);

    // Pass the complete user object through router state
    // This ensures the data is immediately available in the update component
    this.router.navigate(['/booking/seat-reservation', trip.tripId], {
      state: {
        tripId: trip.tripId,
        // Add timestamp to ensure fresh state
        timestamp: Date.now()
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getOccupancy(trip: Trip): number {
    if (!trip.capacity || trip.capacity === 0) return 0;
    const occupied = trip.capacity - trip.availableSeats;
    return Math.round((occupied / trip.capacity) * 100);
  }

  getOccupancyClass(trip: Trip): string {
    const pct = this.getOccupancy(trip);
    if (pct >= 90) return 'occupancy-full';
    if (pct >= 60) return 'occupancy-high';
    if (pct >= 30) return 'occupancy-medium';
    return 'occupancy-low';
  }

  getTripStatusClass(status: string): string {
    const map: Record<string, string> = {
      COMPLETE: 'complete',
      PENDING: 'warning',
      IN_PROGRESS: 'inprogress',
    };
    return map[status] ?? 'default';
  }

  getTripStatusIcon(status: string): string {
    const map: Record<string, string> = {
      COMPLETE: 'pi pi-check-circle',
      PENDING: 'pi pi-clock',
      IN_PROGRESS: 'pi pi-spin pi-spinner',
    };
    return map[status] ?? 'pi pi-circle';
  }

  getTripTypeClass(type: string): string {
    const map: Record<string, string> = {
      SCHEDULE: 'type-schedule',
      CHARTER: 'type-charter',
    };
    return map[type] ?? 'type-default';
  }

  formatTime(time: string): string {
    if (!time) return 'N/A';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }
}
