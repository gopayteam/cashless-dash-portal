// pages/transactions/all-transactions.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { PaymentsApiResponse } from '../../../../@core/models/transactions/payment_reponse.model';
import { PaymentRecord } from '../../../../@core/models/transactions/transactions.models';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { formatDateLocal } from '../../../../@core/utils/date-time.util';
import { ActionButtonComponent } from "../../../components/action-button/action-button";

import { MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-all-transactions',
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
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    ActionButtonComponent,
    MessageModule,
    ToastModule,
    ProgressBarModule,
  ],
  templateUrl: './all.html',
  styleUrls: [
    './all.css',
    '../../../../styles/modules/_transactions.css'
  ],
  providers: [MessageService]
})
export class AllTransactionsComponent implements OnInit {
  entityId: string | null = null;
  transactions: PaymentRecord[] = [];
  allTransactions: PaymentRecord[] = []; // Store all transactions for filtering
  dateRange: Date[] = [];

  // Export progress state
  exportProgress: number = 0;
  exportProgressMessage: string = '';
  showExportProgressDialog: boolean = false;

  // pagination state
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  apiTotalRecords: number = 0; // Store the API total separately
  searchTerm: string = '';

  // Dialog state
  displayDetailDialog: boolean = false;
  selectedTransaction: PaymentRecord | null = null;

  isExporting: boolean = false;

  showExportButtons: boolean = false;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.entityId = user.entityId;

    this.setDefaultDateRange();

    // initial load
    this.loadTransactions();

    // reload on navigation
    // this.router.events.subscribe(() => {
    //   this.fetchTransactions(true);
    // });

    window.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        this.toggleExport();
      }
    });
  }


  setDefaultDateRange(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    this.dateRange = [lastWeek, today];
  }

  loadTransactions($event?: any): void {
    this.fetchTransactions(false, $event);
  }

  fetchTransactions(bypassCache: boolean, $event?: any): void {
    const [start, end] = this.dateRange;
    const event = $event;

    if (!start || !end) {
      console.error('Invalid date range');
      return;
    }

    // Handle pagination from PrimeNG lazy load event
    let page = 0;
    let pageSize = this.rows;

    if (event) {
      page = event.first / event.rows;
      pageSize = event.rows;
      // Update component state
      this.first = event.first;
      this.rows = event.rows;
    }

    const payload = {
      entityId: this.entityId,
      startDate: formatDateLocal(start),
      endDate: formatDateLocal(end),
      page,
      // paymentStatus: 'FAILED',
      // transactionType: 'CREDIT',
      size: pageSize,
      sort: 'createdAt,DESC',
    };

    this.loadingStore.start();

    this.dataService
      .post<PaymentsApiResponse>(API_ENDPOINTS.ALL_PAYMENTS, payload, 'transactions', bypassCache)
      .subscribe({
        next: (response) => {
          this.allTransactions = response.data.manifest;
          this.apiTotalRecords = response.data.totalRecords;
          this.applyClientSideFilter();
          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load all transactions', err);
          this.loadingStore.stop();
        },
      });
  }

  toggleExport(): void {
    this.showExportButtons = !this.showExportButtons;
  }

  applyClientSideFilter(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.transactions = [...this.allTransactions];
      this.totalRecords = this.allTransactions.length;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();

    this.transactions = this.allTransactions.filter((transaction) => {
      return (
        transaction.mpesaReceiptNumber?.toLowerCase().includes(searchLower) ||
        transaction.customerName?.toLowerCase().includes(searchLower) ||
        // transaction.customerPhone?.toLowerCase().includes(searchLower) ||
        transaction.fleetNumber?.toLowerCase().includes(searchLower) ||
        // transaction.transactionId?.toLowerCase().includes(searchLower) ||
        transaction.transactionType?.toLowerCase().includes(searchLower) ||
        transaction.paymentStatus?.toLowerCase().includes(searchLower) ||
        transaction.assignedAmount?.toString().includes(searchLower)
      );
    });

    this.totalRecords = this.transactions.length;
    this.first = 0; // Reset to first page when filtering
  }

  onSearchChange(): void {
    this.applyClientSideFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyClientSideFilter();
  }

  onDateRangeChange(): void {
    this.first = 0;
    this.loadTransactions();
  }

  viewTransactionDetails(transaction: PaymentRecord): void {
    this.selectedTransaction = transaction;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedTransaction = null;
  }

  refresh(): void {
    this.fetchTransactions(true);
  }


  exportToExcel(): void {
    if (this.transactions.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No transactions to export',
        life: 3000
      });
      return;
    }

    try {
      this.isExporting = true;

      const exportData = this.transactions.map(t => ({
        'M-Pesa Receipt': t.mpesaReceiptNumber,
        'Customer Name': t.customerName || 'N/A',
        'Fleet Number': t.fleetNumber,
        'Transaction Type': t.transactionType,
        'Payment Status': t.paymentStatus,
        'Amount (KES)': t.assignedAmount,
        'Trip ID': t.tripId || 'N/A',
        'Pickup': t.pickup || 'N/A',
        'Drop Off': t.dropOff || 'N/A',
        'Driver Username': t.activeDriverUsername || 'N/A',
        'Created At': new Date(t.createdAt).toLocaleString(),
        'Updated At': new Date(t.updatedAt).toLocaleString(),
      }));

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 20 }, // M-Pesa Receipt
        { wch: 22 }, // Customer Name
        { wch: 14 }, // Fleet Number
        { wch: 18 }, // Transaction Type
        { wch: 16 }, // Payment Status
        { wch: 14 }, // Amount
        { wch: 12 }, // Trip ID
        { wch: 20 }, // Pickup
        { wch: 20 }, // Drop Off
        { wch: 22 }, // Driver Username
        { wch: 22 }, // Created At
        { wch: 22 }, // Updated At
      ];

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

      const [start, end] = this.dateRange;
      const startDate = start ? formatDateLocal(start) : 'all';
      const endDate = end ? formatDateLocal(end) : 'time';
      const filename = `transactions_${startDate}_to_${endDate}.xlsx`;

      XLSX.writeFile(wb, filename);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Transactions exported to Excel successfully',
        life: 4000
      });
    } catch (error) {
      console.error('Failed to export to Excel:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export transactions to Excel',
        life: 4000
      });
    } finally {
      this.isExporting = false;
    }
  }

  exportToCSV(): void {
    if (this.transactions.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No transactions to export',
        life: 3000
      });
      return;
    }

    try {
      this.isExporting = true;

      const exportData = this.transactions.map(t => ({
        'M-Pesa Receipt': t.mpesaReceiptNumber,
        'Customer Name': t.customerName || 'N/A',
        'Fleet Number': t.fleetNumber,
        'Transaction Type': t.transactionType,
        'Payment Status': t.paymentStatus,
        'Amount (KES)': t.assignedAmount,
        'Trip ID': t.tripId || 'N/A',
        'Pickup': t.pickup || 'N/A',
        'Drop Off': t.dropOff || 'N/A',
        'Driver Username': t.activeDriverUsername || 'N/A',
        'Created At': new Date(t.createdAt).toLocaleString(),
        'Updated At': new Date(t.updatedAt).toLocaleString(),
      }));

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      const [start, end] = this.dateRange;
      const startDate = start ? formatDateLocal(start) : 'all';
      const endDate = end ? formatDateLocal(end) : 'time';
      const filename = `transactions_${startDate}_to_${endDate}.csv`;

      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Transactions exported to CSV successfully',
        life: 4000
      });
    } catch (error) {
      console.error('Failed to export to CSV:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export transactions to CSV',
        life: 4000
      });
    } finally {
      this.isExporting = false;
    }
  }

  async exportLargeDatasetToCSV(): Promise<void> {
    const [start, end] = this.dateRange;

    if (!start || !end) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Date Range',
        detail: 'Please select a valid date range',
        life: 3000,
      });
      return;
    }

    try {
      this.isExporting = true;
      this.exportProgress = 0;
      this.exportProgressMessage = 'Starting export...';
      this.showExportProgressDialog = true;

      const PAGE_SIZE = 2000;
      let page = 0;
      let fetched = 0;
      let totalRecords = 0; // Will be set from first API response

      const csvRows: string[] = [];

      // CSV Header
      csvRows.push(
        [
          'M-Pesa Receipt',
          'Customer Name',
          'Fleet Number',
          'Transaction Type',
          'Payment Status',
          'Amount (KES)',
          'Trip ID',
          'Pickup',
          'Drop Off',
          'Driver Username',
          'Created At',
          'Updated At',
        ].join(',')
      );

      // Keep fetching until we have all records
      do {
        const payload = {
          entityId: this.entityId,
          startDate: formatDateLocal(start),
          endDate: formatDateLocal(end),
          page,
          size: PAGE_SIZE,
          sort: 'createdAt,DESC',
        };

        const response = await this.dataService
          .post<PaymentsApiResponse>(API_ENDPOINTS.ALL_PAYMENTS, payload, 'transactions', true)
          .toPromise();

        const records = response?.data?.manifest || [];

        // Capture the real total from the first response
        if (page === 0) {
          totalRecords = response?.data?.totalRecords ?? 0;

          if (totalRecords === 0 || records.length === 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'No Data',
              detail: 'No transactions found for the selected date range.',
              life: 3000,
            });
            return;
          }
        }

        // Stop if API returns empty page unexpectedly
        if (records.length === 0) break;

        for (const t of records) {
          csvRows.push(
            [
              this.escapeCSV(t.mpesaReceiptNumber),
              this.escapeCSV(t.customerName || 'N/A'),
              this.escapeCSV(t.fleetNumber),
              this.escapeCSV(t.transactionType),
              this.escapeCSV(t.paymentStatus),
              t.assignedAmount ?? 0,
              this.escapeCSV(t.tripId || 'N/A'),
              this.escapeCSV(t.pickup || 'N/A'),
              this.escapeCSV(t.dropOff || 'N/A'),
              this.escapeCSV(t.activeDriverUsername || 'N/A'),
              this.escapeCSV(new Date(t.createdAt).toLocaleString()),
              this.escapeCSV(new Date(t.updatedAt).toLocaleString()),
            ].join(',')
          );
        }

        fetched += records.length;
        page++;

        // Update progress bar
        this.exportProgress = Math.min(Math.round((fetched / totalRecords) * 100), 99);
        this.exportProgressMessage = `Fetching records... ${fetched.toLocaleString()} of ${totalRecords.toLocaleString()}`;
        this.cdr.detectChanges();

        // Yield to browser to keep UI responsive
        await new Promise((resolve) => setTimeout(resolve, 30));
      } while (fetched < totalRecords);

      // Build and trigger download
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `transactions_${formatDateLocal(start)}_to_${formatDateLocal(end)}_full.csv`;

      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      this.exportProgress = 100;
      this.exportProgressMessage = `Done! ${fetched.toLocaleString()} records exported.`;
      this.cdr.detectChanges();

      // Auto-close dialog after a short delay
      await new Promise((resolve) => setTimeout(resolve, 1800));
      this.showExportProgressDialog = false;

      this.messageService.add({
        severity: 'success',
        summary: 'Export Complete',
        detail: `${fetched.toLocaleString()} transactions exported successfully`,
        life: 5000,
      });
    } catch (error) {
      console.error('Large export failed:', error);
      this.showExportProgressDialog = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: 'An error occurred during export. Please try again.',
        life: 5000,
      });
    } finally {
      this.isExporting = false;
    }
  }

  // async exportLargeDatasetToCSV22(): Promise<void> {
  //   try {
  //     this.isExporting = true;

  //     const [start, end] = this.dateRange;

  //     if (!start || !end) {
  //       this.messageService.add({
  //         severity: 'warn',
  //         summary: 'Invalid Date Range',
  //         detail: 'Please select a valid date range',
  //         life: 3000
  //       });
  //       return;
  //     }

  //     const TOTAL_RECORDS = 150000;
  //     const PAGE_SIZE = 2000;

  //     let page = 0;
  //     let fetched = 0;

  //     const csvRows: string[] = [];

  //     // CSV Header
  //     csvRows.push([
  //       'M-Pesa Receipt',
  //       'Customer Name',
  //       'Fleet Number',
  //       'Transaction Type',
  //       'Payment Status',
  //       'Amount (KES)',
  //       'Trip ID',
  //       'Pickup',
  //       'Drop Off',
  //       'Driver Username',
  //       'Created At',
  //       'Updated At'
  //     ].join(','));

  //     while (fetched < TOTAL_RECORDS) {

  //       const payload = {
  //         entityId: this.entityId,
  //         startDate: formatDateLocal(start),
  //         endDate: formatDateLocal(end),
  //         page,
  //         size: PAGE_SIZE,
  //         sort: 'createdAt,DESC',
  //       };

  //       const response = await this.dataService
  //         .post<PaymentsApiResponse>(
  //           API_ENDPOINTS.ALL_PAYMENTS,
  //           payload,
  //           'transactions',
  //           true
  //         )
  //         .toPromise();

  //       const records = response?.data?.manifest || [];

  //       if (records.length === 0) {
  //         break;
  //       }

  //       for (const t of records) {

  //         const row = [
  //           this.escapeCSV(t.mpesaReceiptNumber),
  //           this.escapeCSV(t.customerName || 'N/A'),
  //           this.escapeCSV(t.fleetNumber),
  //           this.escapeCSV(t.transactionType),
  //           this.escapeCSV(t.paymentStatus),
  //           t.assignedAmount ?? 0,
  //           this.escapeCSV(t.tripId || 'N/A'),
  //           this.escapeCSV(t.pickup || 'N/A'),
  //           this.escapeCSV(t.dropOff || 'N/A'),
  //           this.escapeCSV(t.activeDriverUsername || 'N/A'),
  //           this.escapeCSV(new Date(t.createdAt).toLocaleString()),
  //           this.escapeCSV(new Date(t.updatedAt).toLocaleString()),
  //         ];

  //         csvRows.push(row.join(','));
  //       }

  //       fetched += records.length;
  //       page++;

  //       this.messageService.add({
  //         severity: 'info',
  //         summary: 'Export Progress',
  //         detail: `Fetched ${fetched.toLocaleString()} records...`,
  //         life: 1500
  //       });

  //       // Yield control to browser to prevent freezing
  //       await new Promise(resolve => setTimeout(resolve, 50));
  //     }

  //     const csvContent = csvRows.join('\n');

  //     const blob = new Blob(
  //       [csvContent],
  //       { type: 'text/csv;charset=utf-8;' }
  //     );

  //     const link = document.createElement('a');

  //     const startDate = formatDateLocal(start);
  //     const endDate = formatDateLocal(end);

  //     const filename =
  //       `transactions_${startDate}_to_${endDate}_large.csv`;

  //     link.href = URL.createObjectURL(blob);
  //     link.download = filename;

  //     document.body.appendChild(link);
  //     link.click();

  //     document.body.removeChild(link);

  //     URL.revokeObjectURL(link.href);

  //     this.messageService.add({
  //       severity: 'success',
  //       summary: 'Export Complete',
  //       detail: `${fetched.toLocaleString()} transactions exported successfully`,
  //       life: 5000
  //     });

  //   } catch (error) {

  //     console.error('Large export failed:', error);

  //     this.messageService.add({
  //       severity: 'error',
  //       summary: 'Export Failed',
  //       detail: 'Failed to export transactions',
  //       life: 5000
  //     });

  //   } finally {
  //     this.isExporting = false;
  //   }
  // }

  private escapeCSV(value: any): string {
    if (value === null || value === undefined) {
      return '""';
    }

    const stringValue = String(value).replace(/"/g, '""');

    return `"${stringValue}"`;
  }

  checkPaymentStatus(transaction: PaymentRecord): void {
    this.router.navigate(['/payments/status'], {
      queryParams: {
        merchantId: this.entityId,           // from AuthService
        checkoutId: transaction.mpesaReceiptNumber,
      },
    });
  }
}
