// pages/parcels/parcels.component.ts
import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
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
import { AuthService } from '../../../../@core/services/auth.service';
import { ParcelReceiptService } from '../../../../@core/services/parcel-receipt.service';
import { Router } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ParcelReceiptComponent } from "../../../components/parcel-receipt/parcel-receipt";
import { ParcelReceiptGenerationService } from '../../../../@core/services/parcel-receipts.service';

@Component({
  standalone: true,
  selector: 'app-parcels',
  templateUrl: './parcels.html',
  styleUrls: [
    './parcels.css',
    '../../../../styles/modules/_cards.css',
    '../../../../styles/global/_grid_layout.css',
    '../../../../styles/global/_toast.css',
    '../../../../styles/modules/_filter_actions.css'

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
    MatSelectModule,
    InputTextModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MessageModule,
    ToastModule,
    ParcelReceiptComponent
  ],
})
export class ParcelsComponent implements OnInit {
  entityId: string | null = null;
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
  displayReceiptDialog = false;
  selectedParcel: Parcel | null = null;

  // Download state
  isDownloading = false;
  isSimpleReceiptDownloading = false;
  isThermalReceiptDownloading = false;
  isColorReceiptDownloading = false;

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
    public authService: AuthService,
    private receiptService: ParcelReceiptService,
    private receiptGenerationService: ParcelReceiptGenerationService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {

    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId
      // console.log('Logged in as:', user.username);
    } else {
      this.router.navigate(['/login']);
      console.log('No user logged in');
    }

    this.setDefaultDateRange();
    this.loadParcels({ first: 0, rows: this.rows });
  }

  setDefaultDateRange(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    this.filters.dateRange = [lastWeek, today];
  }

  loadParcels($event: any): void {
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

    this.loadingStore.start();

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

  viewParcelDetails(parcel: Parcel): void {
    this.selectedParcel = parcel;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedParcel = null;
  }

  openReceipt(parcel: Parcel) {
    this.selectedParcel = parcel;
    if (this.displayDetailDialog == true) {
      this.displayDetailDialog = false;
    }
    this.displayReceiptDialog = true;
  }

  closeReceiptDialog(): void {
    this.displayReceiptDialog = false;
    this.selectedParcel = null;
  }


  /**
   * Download receipt as PDF
   */
  async downloadReceipt(): Promise<void> {
    if (!this.selectedParcel) {
      return;
    }

    try {
      this.isDownloading = true;
      await this.receiptService.generateReceipt(this.selectedParcel);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Receipt downloaded successfully',
        life: 4000
      });
    } catch (error) {
      console.error('Failed to download receipt:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download receipt',
        life: 4000
      });
    } finally {
      this.isDownloading = false;
    }
  }

  async generateThermalReceipt(): Promise<void> {
    if (!this.selectedParcel) {
      return;
    }

    try {
      this.isThermalReceiptDownloading = true;
      await this.receiptGenerationService.generateThermalReceipt(this.selectedParcel);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Thermal receipt downloaded successfully',
        life: 4000
      });
    } catch (error) {
      console.error('Failed to download thermal receipt:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download thermal receipt',
        life: 4000
      });
    } finally {
      this.isThermalReceiptDownloading = false;
    }
  }


  async generateSimpleReceipt(): Promise<void> {
    if (!this.selectedParcel) {
      return;
    }

    try {
      this.isSimpleReceiptDownloading = true;
      await this.receiptGenerationService.generateSimpleReceipt(this.selectedParcel);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Receipt downloaded successfully',
        life: 4000
      });
    } catch (error) {
      console.error('Failed to download simple receipt:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download simple receipt',
        life: 4000
      });
    } finally {
      this.isSimpleReceiptDownloading = false;
    }
  }

  async downloadReceipt2(parcel: Parcel): Promise<void> {

    try {
      this.isColorReceiptDownloading = true;
      await this.receiptService.generateReceipt(parcel);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Color receipt downloaded successfully',
        life: 4000
      });
    } catch (error) {
      console.error('Failed to download color receipt:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download color receipt',
        life: 4000
      });
    } finally {
      this.isColorReceiptDownloading = false;
    }
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
