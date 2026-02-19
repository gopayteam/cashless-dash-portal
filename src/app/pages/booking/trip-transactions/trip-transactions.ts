// pages/trips/trip-transactions/trip-transactions.ts
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

export interface TripTransaction {
  id: number;
  softDelete: boolean;
  entityId: string;
  mpesaReceiptNumber: string;
  fleetNumber: string;
  tripId: number;
  numberOfSeats: number;
  pickupId: number;
  dropOffId: number;
  customerName: string;
  phoneNumber: string;
  username: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  boardNumber: string;
  paymentSource: string | null;
}

export interface TripTransactionsApiResponse {
  status: number;
  message: string;
  data: TripTransaction[];
  totalRecords: number;
}

interface StatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-trip-transactions',
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
  templateUrl: './trip-transactions.html',
  styleUrls: ['./trip-transactions.css', '../../../../styles/global/_toast.css'],
  providers: [MessageService],
})
export class TripTransactionsComponent implements OnInit {
  /** Optional @Input — when embedding this component inside a parent */
  @Input() tripId: number | null = null;

  entityId: string | null = null;

  transactions: TripTransaction[] = [];
  allTransactions: TripTransaction[] = [];
  filteredTransactions: TripTransaction[] = [];

  // Pagination
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  // Filters
  searchTerm: string = '';
  selectedStatus: string = '';

  // Detail dialog
  displayDetailDialog: boolean = false;
  selectedTransaction: TripTransaction | null = null;

  // Summary stats
  totalTransactions: number = 0;
  totalRevenue: number = 0;
  startedCount: number = 0;
  completedCount: number = 0;
  failedCount: number = 0;
  totalSeats: number = 0;

  /** True once a valid tripId has been resolved and data has been requested */
  hasLoaded: boolean = false;

  /** Human-readable reason shown in the empty state when no tripId is available */
  noTripIdMessage: string = '';

  statusOptions: StatusOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Started', value: 'STARTED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Pending', value: 'PENDING' },
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

    // 1. Prefer @Input() from a parent component
    // 2. Fall back to route navigation state  (router.navigate state object)
    // 3. Fall back to route param :tripId
    // 4. If nothing found — show a prompt, do NOT fetch
    if (!this.tripId) {
      const navState = this.router.getCurrentNavigation()?.extras?.state
        ?? history.state;

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
      this.loadTransactions();
    } else {
      // No tripId available — show the empty/prompt state, no fetch
      this.noTripIdMessage =
        'No Trip ID was provided. Navigate here from a trip row to view its transactions.';
    }
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadTransactions($event?: any): void {
    this.lastEvent = $event;
    this.fetchTransactions(false, $event);
  }

  fetchTransactions(bypassCache: boolean, $event?: any): void {
    if (!this.tripId) return;

    if ($event) {
      this.first = $event.first;
      this.rows = $event.rows;
    }

    const params = { tripId: this.tripId };

    this.loadingStore.start();
    this.hasLoaded = true;

    this.dataService
      .get<TripTransactionsApiResponse>(
        `${API_ENDPOINTS.TRIP_TRANSACTIONS}/${this.tripId}`,
        params,
        'trip-transactions',
        bypassCache
      )
      .subscribe({
        next: (response) => {
          this.allTransactions = response.data;
          this.totalRecords = response.totalRecords;
          this.calculateStats();
          this.applyClientSideFilter();
          setTimeout(() => this.cdr.detectChanges());
        },
        error: (err) => {
          console.error('Failed to load trip transactions', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load transactions. Please try again.',
            life: 5000,
          });
        },
        complete: () => this.loadingStore.stop(),
      });
  }

  onPageChange(event: any): void {
    this.loadTransactions(event);
  }

  calculateStats(): void {
    this.totalTransactions = this.allTransactions.length;
    this.totalRevenue = this.allTransactions.reduce((s, t) => s + (t.amount ?? 0), 0);
    this.startedCount = this.allTransactions.filter((t) => t.status === 'STARTED').length;
    this.completedCount = this.allTransactions.filter((t) => t.status === 'COMPLETED').length;
    this.failedCount = this.allTransactions.filter((t) => t.status === 'FAILED').length;
    this.totalSeats = this.allTransactions.reduce((s, t) => s + (t.numberOfSeats ?? 0), 0);
  }

  applyClientSideFilter(): void {
    let filtered = [...this.allTransactions];

    if (this.searchTerm.trim()) {
      const lower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.customerName?.toLowerCase().includes(lower) ||
          t.phoneNumber?.includes(lower) ||
          t.username?.toLowerCase().includes(lower) ||
          t.mpesaReceiptNumber?.toLowerCase().includes(lower) ||
          t.fleetNumber?.toLowerCase().includes(lower) ||
          String(t.id).includes(lower)
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter((t) => t.status === this.selectedStatus);
    }

    // Client-side pagination slice
    const start = this.first;
    const end = start + this.rows;
    this.filteredTransactions = filtered;
    this.transactions = filtered.slice(start, end);
  }

  onSearchChange(): void {
    this.first = 0;
    this.applyClientSideFilter();
  }

  onStatusChange(): void {
    this.first = 0;
    this.applyClientSideFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyClientSideFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.first = 0;
    this.applyClientSideFilter();
  }

  refresh(): void {
    if (this.lastEvent) {
      this.fetchTransactions(true, this.lastEvent);
    } else {
      this.fetchTransactions(true, { first: 0, rows: this.rows });
    }
  }

  goBack(): void {
    this.router.navigate(['/booking/all-trips']);
  }

  // ── Detail dialog ─────────────────────────────────────────────────────────

  viewTransactionDetails(transaction: TripTransaction): void {
    this.selectedTransaction = transaction;
    this.displayDetailDialog = true;
    setTimeout(() => this.cdr.detectChanges());
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedTransaction = null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      STARTED: 'inprogress',
      COMPLETED: 'complete',
      FAILED: 'rejected',
      PENDING: 'warning',
    };
    return map[status] ?? 'default';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      STARTED: 'pi pi-send',
      COMPLETED: 'pi pi-check-circle',
      FAILED: 'pi pi-times-circle',
      PENDING: 'pi pi-clock',
    };
    return map[status] ?? 'pi pi-circle';
  }

  formatCurrency(amount: number): string {
    return `KES ${amount?.toFixed(2) ?? '0.00'}`;
  }
}
