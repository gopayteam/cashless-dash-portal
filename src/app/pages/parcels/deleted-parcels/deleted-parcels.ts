// pages/deleted-parcels/deleted-parcels.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { DeletedParcel } from '../../../../@core/models/parcels/deleted-parcels/deleted-parcel.model';
import { ApiResponse } from '../../../../@core/models/parcels/deleted-parcels/deleted-parcel-response.model';

@Component({
  standalone: true,
  selector: 'app-deleted-parcels',
  templateUrl: './deleted-parcels.html',
  styleUrls: [
    './deleted-parcels.css',
    '../../../../styles/styles.css',  
  ],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    DialogModule,
    TooltipModule,
    ProgressSpinnerModule,
    InputTextModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
  ],
})
export class DeletedParcelsComponent implements OnInit {
  entityId: string | null = null;
  deletedParcels: DeletedParcel[] = [];
  dateRange: Date[] = [];

  // Pagination
  totalRecords = 0;
  rows = 10;
  first = 0;

  // Server-side Filters
  filters = {
    parcelNumber: '',
    senderName: '',
    receiverName: '',
    paymentMethod: null as DeletedParcel['paymentMethod'] | null,
    parcelStatus: null as DeletedParcel['parcelStatus'] | null,
    dateRange: [] as Date[],
  };

  // Search
  searchTerm = '';

  // Dialog
  displayDetailDialog = false;
  selectedParcel: DeletedParcel | null = null;

  // Dropdown options
  paymentMethods: DeletedParcel['paymentMethod'][] = ['CASH', 'CASHLESS'];
  parcelStatuses: DeletedParcel['parcelStatus'][] = [
    'REGISTERED',
    'IN_TRANSIT',
    'ARRIVED',
  ];

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId;
    } else {
      this.router.navigate(['/login']);
      console.log('No user logged in');
    }

    this.setDefaultDateRange();
    this.loadDeletedParcels({ first: 0, rows: this.rows });
  }

  setDefaultDateRange(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    this.filters.dateRange = [lastWeek, today];
  }

  loadDeletedParcels($event: any): void {
    const [start, end] = this.filters.dateRange;
    const event = $event;

    if (!start || !end) {
      console.warn('Date range not set, skipping load');
      return;
    }

    const page = event?.first ? event.first / event.rows : 0;
    const size = event?.rows ?? this.rows;

    this.first = event?.first ?? 0;
    this.rows = size;

    const payload = {
      entityId: this.entityId,
      page: page,
      size: size,
      startDate: start ? start.toISOString().split('T')[0] : null,
      endDate: end ? end.toISOString().split('T')[0] : null,
    };

    this.loadingStore.start();

    this.dataService
      .post<ApiResponse<DeletedParcel>>(
        API_ENDPOINTS.ALL_DELETED_PARCELS,
        payload,
        'deleted-parcels'
      )
      .subscribe({
        next: (response) => {
          this.deletedParcels = response.data;
          this.totalRecords = response.totalRecords;

          this.rows = event.rows;
          this.first = event.first;

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load deleted parcels', err);
        },
        complete: () => this.loadingStore.stop(),
      });
  }

  /** Triggered by filter form */
  applyFilters(): void {
    this.first = 0;
    this.loadDeletedParcels({ first: 0, rows: this.rows });
  }

  resetFilters(): void {
    this.filters = {
      parcelNumber: '',
      senderName: '',
      receiverName: '',
      paymentMethod: null,
      parcelStatus: null,
      dateRange: [],
    };
    this.setDefaultDateRange();
    this.searchTerm = '';
    this.applyFilters();
  }

  onSearchChange(): void {
    this.filters.parcelNumber = this.searchTerm;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filters.parcelNumber = '';
    this.applyFilters();
  }

  viewParcelDetails(parcel: DeletedParcel): void {
    this.selectedParcel = parcel;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedParcel = null;
  }

  getStatusClass(status: DeletedParcel['parcelStatus']): string {
    const statusMap: Record<DeletedParcel['parcelStatus'], string> = {
      REGISTERED: 'badge-pending',
      IN_TRANSIT: 'badge-booking',
      ARRIVED: 'badge-completed',
    };
    return statusMap[status];
  }

  getPaymentStatusClass(status: DeletedParcel['paymentStatus']): string {
    const statusMap: Record<DeletedParcel['paymentStatus'], string> = {
      PAID: 'badge-paid',
      PENDING: 'badge-pending',
      FAILED: 'badge-failed',
    };
    return statusMap[status];
  }

  getPaymentMethodClass(method: DeletedParcel['paymentMethod']): string {
    return method === 'CASH' ? 'badge-debit' : 'badge-credit';
  }

  // Helper method to get location name from ID (you may need to implement this based on your data)
  getLocationName(locationId: number): string {
    // TODO: Implement location lookup from your location service/data
    return `Location ${locationId}`;
  }
}
