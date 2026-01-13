// pages/parcels/parcels.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MatSelectModule } from '@angular/material/select';
import { InputTextModule } from 'primeng/inputtext';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';

import { Parcel } from '../../../../@core/models/parcels/parcel.model';
import { ParcelsAPiResponse } from '../../../../@core/models/parcels/parcel_response.model';
import { mapParcelStatsToCards } from '../../../../@core/mappers/dashboard.mapper';

@Component({
  standalone: true,
  selector: 'app-parcels',
  templateUrl: './parcels.html',
  styleUrls: ['./parcels.css'],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    DialogModule,
    TooltipModule,
    ProgressSpinnerModule,
    MatSelectModule,
    InputTextModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
  ],
})
export class ParcelsComponent implements OnInit {
  parcels: Parcel[] = [];
  dateRange: Date[] = [];

  // Pagination
  totalRecords = 0;
  rows = 10;
  first = 0;

  // Stats Cards
  statsCards: any[] = [];

  // Server-side Filters
  filters = {
    parcelNumber: '',
    sourceName: '',
    destinationName: '',
    paymentMethod: null as Parcel['paymentMethod'] | null,
    parcelStatus: null as Parcel['parcelStatus'] | null,
    dateRange: [] as Date[],
  };

  // Search
  searchTerm = '';

  // Dialog
  displayDetailDialog = false;
  selectedParcel: Parcel | null = null;

  // Dropdown options
  paymentMethods: Parcel['paymentMethod'][] = ['CASH', 'CASHLESS'];
  parcelStatuses: Parcel['parcelStatus'][] = [
    'REGISTERED',
    'IN_TRANSIT',
    'ARRIVED',
    'COLLECTED',
    'CANCELLED',
  ];

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private cdr: ChangeDetectorRef
  ) {}

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    this.loadParcels({ first: 0, rows: this.rows });
  }

  setDefaultDateRange(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    this.dateRange = [lastWeek, today];
  }

  loadParcels($event: any): void {
    this.loadingStore.start();
    const event = $event;

    const page = event.first / event.rows;
    const [start, end] = this.filters.dateRange || [];
    // const [start, end] = this.dateRange;

    const payload = {
      entityId: 'GS000002',
      page,
      size: event.rows,
      // transactionType: 'DEBIT',
      paymentStatus: 'PAID',

      // ✅ Server-side filters
      parcelNumber: this.filters.parcelNumber || null,
      sourceName: this.filters.sourceName || null,
      destinationName: this.filters.destinationName || null,
      paymentMethod: this.filters.paymentMethod || null,
      parcelStatus: this.filters.parcelStatus || null,
      startDate: start ? start.toISOString().split('T')[0] : null,
      endDate: end ? end.toISOString().split('T')[0] : null,

      sort: 'createdAt,DESC',
    };

    this.dataService
      .post<ParcelsAPiResponse>(API_ENDPOINTS.ALL_PARCELS, payload, 'parcels')
      .subscribe({
        next: (response) => {
          this.parcels = response.parcels;
          this.totalRecords = response.totalItems;

          // Stats always come from API
          this.statsCards = mapParcelStatsToCards(response);

          this.rows = event.rows;
          this.first = event.first;

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load parcels', err);
        },
        complete: () => this.loadingStore.stop(),
      });
  }

  /** Triggered by filter form */
  applyFilters(): void {
    this.first = 0;
    this.loadParcels({ first: 0, rows: this.rows });
  }

  resetFilters(): void {
    this.filters = {
      parcelNumber: '',
      sourceName: '',
      destinationName: '',
      paymentMethod: null,
      parcelStatus: null,
      dateRange: [],
    };

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

  viewParcelDetails(parcel: Parcel): void {
    this.selectedParcel = parcel;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedParcel = null;
  }

  getStatusClass(status: Parcel['parcelStatus']): string {
    const statusMap: Record<Parcel['parcelStatus'], string> = {
      REGISTERED: 'badge-pending',
      IN_TRANSIT: 'badge-booking',
      ARRIVED: 'badge-completed',
      COLLECTED: 'badge-paid',
      CANCELLED: 'badge-failed',
    };
    return statusMap[status];
  }

  getPaymentStatusClass(status: Parcel['paymentStatus']): string {
    const statusMap: Record<Parcel['paymentStatus'], string> = {
      PAID: 'badge-paid',
      UNPAID: 'badge-failed',
      PENDING: 'badge-pending',
    };
    return statusMap[status];
  }

  getPaymentMethodClass(method: Parcel['paymentMethod']): string {
    return method === 'CASH' ? 'badge-debit' : 'badge-credit';
  }
}
