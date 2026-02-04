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
import { InputTextModule } from 'primeng/inputtext';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { Parcel } from '../../../../@core/models/parcels/parcel.model';
import { ParcelsAPiResponse, SingleParcelsAPiResponse } from '../../../../@core/models/parcels/parcel_response.model';
import { mapParcelStatsToCards } from '../../../../@core/mappers/dashboard.mapper';
import { AuthService } from '../../../../@core/services/auth.service';
import { ParcelReceiptService } from '../../../../@core/services/parcel-receipt.service';
import { Router } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ParcelReceiptComponent } from "../../../components/parcel-receipt/parcel-receipt";
import { ParcelReceiptGenerationService } from '../../../../@core/services/parcel-receipts.service';
import * as XLSX from 'xlsx';
import { Stage } from '../../../../@core/models/locations/stage.model';
import { ParcelSelectedStageApiResponse } from '../../../../@core/models/parcels/parcel_stage_response';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { SelectModule } from 'primeng/select';


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
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    InputTextModule,
    MessageModule,
    ToastModule,
    ParcelReceiptComponent,
    SelectModule
  ],
})
export class ParcelsComponent implements OnInit {
  entityId: string | null = null;
  parcels: Parcel[] = [];

  // Pagination
  totalRecords = 0;
  rows = 10;
  first = 0;

  // Stats Cards
  statsCards: any[] = [];

  // Stages
  stages: Stage[] = [];
  sourceStages: Stage[] = [];
  destinationStages: Stage[] = [];

  // Server-side Filters
  filters = {
    parcelNumber: '',
    sourceId: null as number | null,
    destinationId: null as number | null,
    paymentMethod: null as Parcel['paymentMethod'] | null,
    parcelStatus: null as Parcel['parcelStatus'] | null,
    dateRange: [] as Date[],
  };

  // Search state
  isSearching = false;
  searchDebounceTimer: any;

  // Dialog
  displayDetailDialog = false;
  displayReceiptDialog = false;
  selectedParcel: Parcel | null = null;

  // Download state
  isDownloading = false;
  isSimpleReceiptDownloading = false;
  isThermalReceiptDownloading = false;
  isColorReceiptDownloading = false;
  isExporting = false;

  // Dropdown options
  paymentMethods: Parcel['paymentMethod'][] = ['CASH', 'CASHLESS'];
  parcelStatuses: Parcel['parcelStatus'][] = [
    'REGISTERED',
    'IN_TRANSIT',
    'ARRIVED',
    'COLLECTED',
    'CANCELLED',
  ];

  // Dropdown options with labels and icons
  paymentMethodOptions = [
    { label: 'Cash', value: 'CASH', icon: 'pi pi-money-bill' },
    { label: 'Cashless', value: 'CASHLESS', icon: 'pi pi-credit-card' }
  ];

  parcelStatusOptions = [
    { label: 'Registered', value: 'REGISTERED', icon: 'pi pi-box' },
    { label: 'In Transit', value: 'IN_TRANSIT', icon: 'pi pi-truck' },
    { label: 'Arrived', value: 'ARRIVED', icon: 'pi pi-inbox' },
    { label: 'Collected', value: 'COLLECTED', icon: 'pi pi-check-circle' },
    { label: 'Cancelled', value: 'CANCELLED', icon: 'pi pi-times-circle' }
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
      this.entityId = user.entityId;
    } else {
      this.router.navigate(['/login']);
      console.log('No user logged in');
      return;
    }

    this.setDefaultDateRange();
    this.loadStages();
  }

  setDefaultDateRange(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    this.filters.dateRange = [lastWeek, today];
  }

  /**
   * Load stages from API
   */
  loadStages(): void {
    if (!this.entityId) return;

    // const stagesEndpoint = `${}?entityId=${this.entityId}`;

    const payload = {
      entityId: this.entityId,
      page: 0, size: 500
    }

    this.dataService
      .post<ParcelSelectedStageApiResponse>(API_ENDPOINTS.ENTITY_STAGES, payload, 'stages')
      .subscribe({
        next: (response) => {
          this.stages = response.data;
          this.sourceStages = [...this.stages];
          this.destinationStages = [...this.stages];

          // Load parcels after stages are loaded
          this.loadParcels({ first: 0, rows: this.rows });
        },
        error: (err) => {
          console.error('Failed to load stages', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load stages',
            life: 4000
          });
          // Still load parcels even if stages fail
          this.loadParcels({ first: 0, rows: this.rows });
        }
      });
  }

  /**
   * Load parcels from server with server-side filtering
   */
  loadParcels($event: any): void {
    const [start, end] = this.filters.dateRange;

    if (!start || !end) {
      console.warn('Date range not set, skipping load');
      return;
    }

    const page = $event?.first ? $event.first / $event.rows : 0;
    const size = $event?.rows ?? this.rows;

    this.first = $event?.first ?? 0;
    this.rows = size;

    // Build server-side payload
    const payload: any = {
      entityId: this.entityId,
      page: page,
      size: size,
      paymentStatus: 'PAID',
      startDate: start ? start.toISOString().split('T')[0] : null,
      endDate: end ? end.toISOString().split('T')[0] : null,
      sort: 'createdAt,DESC',
    };

    // Add optional filters
    if (this.filters.sourceId) {
      payload.sourceId = this.filters.sourceId;
    }
    if (this.filters.destinationId) {
      payload.destinationId = this.filters.destinationId;
    }
    if (this.filters.paymentMethod) {
      payload.paymentMethod = this.filters.paymentMethod;
    }
    if (this.filters.parcelStatus) {
      payload.parcelStatus = this.filters.parcelStatus;
    }

    this.loadingStore.start();

    this.dataService
      .post<ParcelsAPiResponse>(API_ENDPOINTS.ALL_PARCELS, payload, 'parcels')
      .subscribe({
        next: (response) => {
          this.parcels = response.parcels;
          this.totalRecords = response.totalItems;

          // Stats always come from API
          this.statsCards = mapParcelStatsToCards(response);

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load parcels', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load parcels',
            life: 4000
          });
        },
        complete: () => this.loadingStore.stop(),
      });
  }

  /**
   * Search by parcel number using API endpoint
   */
  searchByParcelNumber(): void {
    // Clear any existing debounce timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    const parcelNumber = this.filters.parcelNumber?.trim();

    if (!parcelNumber) {
      // If search is cleared, reload normal data
      this.loadParcels({ first: 0, rows: this.rows });
      return;
    }

    // Debounce search
    this.searchDebounceTimer = setTimeout(() => {
      this.performSearch(parcelNumber);
    }, 500);
  }

  private performSearch(parcelNumber: string): void {
    if (!this.entityId) return;

    this.isSearching = true;
    this.loadingStore.start();

    const searchEndpoint = `${API_ENDPOINTS.FIND_PARCEL_BY_NUMBER}?parcelNumber=${parcelNumber}&entityId=${this.entityId}`;

    const params = {
      parcelNumber: parcelNumber,
      entityId: this.entityId
    }

    this.dataService
      .post<SingleParcelsAPiResponse>(searchEndpoint, 'single-parcel')
      .subscribe({
        next: (parcel) => {
          // Single parcel result
          this.parcels = parcel.data ? [parcel.data] : [];
          this.totalRecords = 1;
          this.isSearching = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Parcel not found', err);
          this.parcels = [];
          this.totalRecords = 0;
          this.isSearching = false;
          this.messageService.add({
            severity: 'warn',
            summary: 'Not Found',
            detail: `Parcel ${parcelNumber} not found`,
            life: 4000
          });
        },
        complete: () => {
          this.loadingStore.stop();
          this.isSearching = false;
        }
      });
  }

  /** Apply server-side filters and reload data */
  applyFilters(): void {
    this.first = 0;
    this.loadParcels({ first: 0, rows: this.rows });
  }

  /** Handle date range change from calendar */
  onDateRangeChange(): void {
    if (this.filters.dateRange && this.filters.dateRange.length === 2) {
      const [start, end] = this.filters.dateRange;
      if (start && end) {
        this.loadParcels({ first: 0, rows: this.rows });
      }
    }
  }

  resetFilters(): void {
    this.filters = {
      parcelNumber: '',
      sourceId: null,
      destinationId: null,
      paymentMethod: null,
      parcelStatus: null,
      dateRange: [],
    };
    this.setDefaultDateRange();

    // Reload data from server with reset filters
    this.first = 0;
    this.loadParcels({ first: 0, rows: this.rows });
  }

  onParcelNumberChange(): void {
    this.searchByParcelNumber();
  }

  clearSearch(): void {
    this.filters.parcelNumber = '';
    this.loadParcels({ first: 0, rows: this.rows });
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

  /**
   * Export parcels to Excel
   */
  exportToExcel(): void {
    if (this.parcels.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No parcels to export',
        life: 3000
      });
      return;
    }

    try {
      this.isExporting = true;

      // Prepare data for export
      const exportData = this.parcels.map(parcel => ({
        'Parcel Number': parcel.parcelNumber,
        'Sender Name': parcel.senderName,
        'Sender Phone': parcel.senderPhoneNumber,
        'Receiver Name': parcel.receiverName,
        'Receiver Phone': parcel.receiverPhoneNumber,
        'Source': parcel.sourceName,
        'Destination': parcel.destinationName,
        'Fleet No': parcel.fleetNo || 'N/A',
        'Description': parcel.description || 'N/A',
        'Parcel Value': parcel.value,
        'Service Charge': parcel.serviceCharge,
        'Total Amount': parcel.amount,
        'Payment Method': parcel.paymentMethod,
        'Payment Status': parcel.paymentStatus,
        'Parcel Status': parcel.parcelStatus,
        'M-Pesa Receipt': parcel.mpesaReceiptNumber || 'N/A',
        'Created At': new Date(parcel.createdAt).toLocaleString(),
        'Dispatched At': parcel.dispatchedAt ? new Date(parcel.dispatchedAt).toLocaleString() : 'N/A',
        'Arrived At': parcel.arrivedAt ? new Date(parcel.arrivedAt).toLocaleString() : 'N/A',
        'Picked At': parcel.pickedAt ? new Date(parcel.pickedAt).toLocaleString() : 'N/A',
        'Picked By': parcel.pickedBy || 'N/A',
        'Last Mile': parcel.lastMile || 'N/A'
      }));

      // Create worksheet
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Parcel Number
        { wch: 20 }, // Sender Name
        { wch: 15 }, // Sender Phone
        { wch: 20 }, // Receiver Name
        { wch: 15 }, // Receiver Phone
        { wch: 20 }, // Source
        { wch: 20 }, // Destination
        { wch: 12 }, // Fleet No
        { wch: 30 }, // Description
        { wch: 15 }, // Parcel Value
        { wch: 15 }, // Service Charge
        { wch: 15 }, // Total Amount
        { wch: 15 }, // Payment Method
        { wch: 15 }, // Payment Status
        { wch: 15 }, // Parcel Status
        { wch: 20 }, // M-Pesa Receipt
        { wch: 20 }, // Created At
        { wch: 20 }, // Dispatched At
        { wch: 20 }, // Arrived At
        { wch: 20 }, // Picked At
        { wch: 20 }, // Picked By
        { wch: 15 }  // Last Mile
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Parcels');

      // Generate filename with date range
      const [start, end] = this.filters.dateRange;
      const startDate = start ? start.toISOString().split('T')[0] : 'all';
      const endDate = end ? end.toISOString().split('T')[0] : 'time';
      const filename = `parcels_${startDate}_to_${endDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Parcels exported to Excel successfully',
        life: 4000
      });
    } catch (error) {
      console.error('Failed to export to Excel:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export parcels to Excel',
        life: 4000
      });
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * Export parcels to CSV
   */
  exportToCSV(): void {
    if (this.parcels.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No parcels to export',
        life: 3000
      });
      return;
    }

    try {
      this.isExporting = true;

      // Prepare data for export
      const exportData = this.parcels.map(parcel => ({
        'Parcel Number': parcel.parcelNumber,
        'Sender Name': parcel.senderName,
        'Sender Phone': parcel.senderPhoneNumber,
        'Receiver Name': parcel.receiverName,
        'Receiver Phone': parcel.receiverPhoneNumber,
        'Source': parcel.sourceName,
        'Destination': parcel.destinationName,
        'Fleet No': parcel.fleetNo || 'N/A',
        'Description': parcel.description || 'N/A',
        'Parcel Value': parcel.value,
        'Service Charge': parcel.serviceCharge,
        'Total Amount': parcel.amount,
        'Payment Method': parcel.paymentMethod,
        'Payment Status': parcel.paymentStatus,
        'Parcel Status': parcel.parcelStatus,
        'M-Pesa Receipt': parcel.mpesaReceiptNumber || 'N/A',
        'Created At': new Date(parcel.createdAt).toLocaleString(),
        'Dispatched At': parcel.dispatchedAt ? new Date(parcel.dispatchedAt).toLocaleString() : 'N/A',
        'Arrived At': parcel.arrivedAt ? new Date(parcel.arrivedAt).toLocaleString() : 'N/A',
        'Picked At': parcel.pickedAt ? new Date(parcel.pickedAt).toLocaleString() : 'N/A',
        'Picked By': parcel.pickedBy || 'N/A',
        'Last Mile': parcel.lastMile || 'N/A'
      }));

      // Create worksheet and convert to CSV
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      // Generate filename with date range
      const [start, end] = this.filters.dateRange;
      const startDate = start ? start.toISOString().split('T')[0] : 'all';
      const endDate = end ? end.toISOString().split('T')[0] : 'time';
      const filename = `parcels_${startDate}_to_${endDate}.csv`;

      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Parcels exported to CSV successfully',
        life: 4000
      });
    } catch (error) {
      console.error('Failed to export to CSV:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export parcels to CSV',
        life: 4000
      });
    } finally {
      this.isExporting = false;
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