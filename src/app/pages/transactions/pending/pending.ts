// pages/transactions/all-transactions.component.ts
import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { PaymentRecord } from '../../../../@core/models/transactions/transactions.models';
import { PaymentsApiResponse } from '../../../../@core/models/transactions/payment_reponse.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { ActionButtonComponent } from "../../../components/action-button/action-button";
import { formatDateLocal } from '../../../../@core/utils/date-time.util';

import * as XLSX from 'xlsx';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-pending',
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
  ],
  templateUrl: './pending.html',
  styleUrls: [
    './pending.css',
    '../../../../styles/modules/_transactions.css'
  ],
  providers: [MessageService]
})
export class PendingTransactionsComponent implements OnInit {
  entityId: string | null = null;
  transactions: PaymentRecord[] = [];
  allTransactions: PaymentRecord[] = []; // Store all transactions for filtering
  dateRange: Date[] = [];

  // pagination state
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  apiTotalRecords: number = 0; // Store the API total separately
  searchTerm: string = '';

  // Dialog state
  displayDetailDialog: boolean = false;
  selectedTransaction: PaymentRecord | null = null;

  isExporting = false;

  showExportButtons: boolean = false;

  toggleExport(): void {
    this.showExportButtons = !this.showExportButtons;
  }

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private messageService: MessageService,
    public authService: AuthService,
    private router: Router,
    // private cdr: ChangeDetectorRef
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef
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
      paymentStatus: 'PENDING',
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
    this.fetchTransactions(true)
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
      XLSX.utils.book_append_sheet(wb, ws, 'Pending Transactions');

      const [start, end] = this.dateRange;
      const startDate = start ? formatDateLocal(start) : 'all';
      const endDate = end ? formatDateLocal(end) : 'time';
      const filename = `pending_transactions_${startDate}_to_${endDate}.xlsx`;

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
      const filename = `pending_transactions_${startDate}_to_${endDate}.csv`;

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
}
