// pages/transaction-lookup/transaction-lookup.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

import { Router } from '@angular/router';

import { DataService } from '../../../@core/api/data.service';
import {
  AnalyticsResponseDto,
  ApiErrorResponse,
  ReconciliationResponse,
  StatementDto,
  TransactionLookupDto,
  TransactionSearchFilters
} from '../../../@core/models/lookup/transaction-lookup.model';
import { AuthService } from '../../../@core/services/auth.service';
import { TransactionLookupService } from '../../../@core/services/transaction-lookup.service';
import { LoadingStore } from '../../../@core/state/loading.store';

// Adjust these to match your backend's actual enum values.
const PAYMENT_STATUS_OPTIONS = [
  { label: 'All Statuses', value: null },
  { label: 'Paid', value: 'PAID' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const PAYMENT_SOURCE_OPTIONS = [
  { label: 'All Sources', value: null },
  { label: 'Direct Till', value: 'DIRECT_TILL' },
  { label: 'Paybill', value: 'PAYBILL' },
  { label: 'C2B', value: 'C2B' },
  { label: 'B2C', value: 'B2C' },
];

const PAYMENT_TYPE_OPTIONS = [
  { label: 'All Types', value: null },
  { label: 'Fare', value: 'FARE' },
  { label: 'Top Up', value: 'TOPUP' },
  { label: 'Refund', value: 'REFUND' },
];

const TRANSACTION_TYPE_OPTIONS = [
  { label: 'All', value: null },
  { label: 'Credit', value: 'CREDIT' },
  { label: 'Debit', value: 'DEBIT' },
];

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Date Created', value: 'createdAt' },
  { label: 'Transaction Date', value: 'transactionDate' },
  { label: 'Amount', value: 'amount' },
  { label: 'Last Updated', value: 'updatedAt' },
  { label: 'Fleet Number', value: 'fleetNumber' },
  { label: 'Payment Status', value: 'paymentStatus' },
];

const MAX_EXPORT_PAGES = 20; // safety cap: 20 pages * 100 rows = 2,000 records
const EXPORT_PAGE_SIZE = 100; // API caps collection endpoints at 100/page

@Component({
  standalone: true,
  selector: 'app-transaction-lookup',
  templateUrl: './lookup.html',
  styleUrls: ['./lookup.css', '../../../styles/global/_toast.css',],
  providers: [MessageService],
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
    InputNumberModule,
    DatePickerModule,
    SelectModule,
    TagModule,
    ToastModule,
  ],
})
export class TransactionLookupComponent implements OnInit {
  entityId: string | null = null;

  // ============ Filters ============
  filters: TransactionSearchFilters = {};
  dateFromValue: Date | null = null;
  dateToValue: Date | null = null;
  showAdvancedFilters = false;

  paymentStatusOptions = PAYMENT_STATUS_OPTIONS;
  paymentSourceOptions = PAYMENT_SOURCE_OPTIONS;
  paymentTypeOptions = PAYMENT_TYPE_OPTIONS;
  transactionTypeOptions = TRANSACTION_TYPE_OPTIONS;
  sortOptions = SORT_OPTIONS;

  // ============ Table / Data ============
  transactions: TransactionLookupDto[] = [];
  totalRecords = 0;
  rows = 20;
  first = 0;
  sortField: string = 'createdAt';
  sortOrder: number = -1; // PrimeNG: 1 = asc, -1 = desc
  private lastLazyEvent: any = { first: 0, rows: this.rows };

  // ============ Analytics & Statements Lookup ============
  activeTab: 'transactions' | 'analytics' | 'statements' = 'transactions';
  analyticsSummary: AnalyticsResponseDto | null = null;
  statements: StatementDto[] = [];

  // ============ Stats (current page) ============
  statsCards: any[] = [];

  // ============ Details dialog ============
  displayDetailsDialog = false;
  selectedTransaction: TransactionLookupDto | null = null;
  reconciliation: ReconciliationResponse | null = null;
  checkingReconciliation = false;

  // ============ Export ============
  exportingCsv = false;
  exportingExcel = false;
  exportingAllCsv = false;
  exportingAllExcel = false;

  constructor(
    private dataService: DataService,
    public lookupService: TransactionLookupService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  /**
   * Global variable property for DataService endpoint URL resolution mode (Normal API vs Dev API)
   */
  get useDevUrl(): boolean {
    return this.lookupService.getUseDevUrl();
  }

  set useDevUrl(val: boolean) {
    this.lookupService.setUseDevUrl(val);
  }

  toggleEnvironment(useDev: boolean): void {
    this.useDevUrl = useDev;
    this.messageService.add({
      severity: 'info',
      summary: 'Endpoint URL Environment Switched',
      detail: `Data service calls now targeting: ${useDev ? 'DEV URL (http://localhost:8080)' : 'NORMAL API URL (https://api.gopay.ke)'}`,
    });
    this.loadTransactions(this.lastLazyEvent);
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId;
      this.filters.entityId = user.entityId;
    } else {
      this.router.navigate(['/login']);
      return;
    }

    this.loadTransactions({ first: 0, rows: this.rows });
  }

  // ================= LOADING =================
  loadTransactions(event: any): void {
    this.lastLazyEvent = event;
    this.loadingStore.start();

    const page = Math.floor(event.first / event.rows);
    if (event.sortField) {
      this.sortField = event.sortField;
      this.sortOrder = event.sortOrder ?? this.sortOrder;
    }

    const searchFilters: TransactionSearchFilters = {
      ...this.filters,
      entityId: this.filters.entityId || this.entityId,
      dateFrom: this.toLocalIso(this.dateFromValue),
      dateTo: this.toLocalIso(this.dateToValue),
      page,
      size: event.rows,
      sort: this.sortField,
      direction: this.sortOrder === 1 ? 'ASC' : 'DESC',
    };

    this.lookupService.searchTransactions(searchFilters).subscribe({
      next: (response) => {
        this.transactions = response.data;
        this.totalRecords = response.totalElements;
        this.rows = event.rows;
        this.first = event.first;

        this.calculateStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.handleApiError(err, 'Failed to load transactions');
      },
      complete: () => this.loadingStore.stop(),
    });
  }

  // Formats a Date as local (Africa/Nairobi wall-clock) ISO-8601, e.g. 2026-08-10T17:00:00
  private toLocalIso(date: Date | null): string | null {
    if (!date) return null;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    return `${y}-${m}-${d}T${h}:${min}:${s}`;
  }

  // ================= FILTER ACTIONS =================
  onSearch(): void {
    this.first = 0;
    this.loadTransactions({ ...this.lastLazyEvent, first: 0, rows: this.rows });
  }

  onResetFilters(): void {
    this.filters = { entityId: this.entityId };
    this.dateFromValue = null;
    this.dateToValue = null;
    this.sortField = 'createdAt';
    this.sortOrder = -1;
    this.onSearch();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  get activeFilterCount(): number {
    const { entityId, ...rest } = this.filters;
    const filterValues = Object.values(rest).filter(
      (v) => v !== undefined && v !== null && v !== ''
    );
    const dateCount = (this.dateFromValue ? 1 : 0) + (this.dateToValue ? 1 : 0);
    return filterValues.length + dateCount;
  }

  // ================= STATS (current page only) =================
  calculateStats(): void {
    const pageAmount = this.transactions.reduce(
      (sum, t) => sum + (Number(t.amount) || 0),
      0
    );
    const successCount = this.transactions.filter(
      (t) => t.paymentStatus === 'PAID'
    ).length;
    const failedCount = this.transactions.filter(
      (t) => t.paymentStatus === 'FAILED'
    ).length;

    this.statsCards = [
      {
        title: 'Total Matching Records',
        count: this.totalRecords,
        icon: 'pi-database',
        color: '#6366f1',
        isCurrency: false,
      },
      {
        title: 'This Page — Amount',
        count: pageAmount,
        icon: 'pi-wallet',
        color: '#10b981',
        isCurrency: true,
      },
      {
        title: 'This Page — Paid',
        count: successCount,
        icon: 'pi-check-circle',
        color: '#22c55e',
        isCurrency: false,
      },
      {
        title: 'This Page — Failed',
        count: failedCount,
        icon: 'pi-times-circle',
        color: '#ef4444',
        isCurrency: false,
      },
    ];
  }

  // ================= DETAILS DIALOG =================
  viewDetails(transaction: TransactionLookupDto): void {
    this.selectedTransaction = transaction;
    this.reconciliation = null;
    this.displayDetailsDialog = true;
  }

  closeDetailsDialog(): void {
    this.displayDetailsDialog = false;
    this.selectedTransaction = null;
    this.reconciliation = null;
  }

  checkReconciliation(): void {
    if (!this.selectedTransaction) return;
    const code =
      this.selectedTransaction.mpesaReceiptNumber ||
      String(this.selectedTransaction.id);

    this.checkingReconciliation = true;
    this.lookupService.getReconciliation(code).subscribe({
      next: (res) => {
        this.reconciliation = res;
        this.checkingReconciliation = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.checkingReconciliation = false;
        this.handleApiError(err, 'Reconciliation check failed');
      },
    });
  }

  // ================= EXPORT =================
  exportCurrentPageCsv(): void {
    this.runExport('csv', false);
  }

  exportCurrentPageExcel(): void {
    this.runExport('excel', false);
  }

  exportAllFilteredCsv(): void {
    this.runExport('csv', true);
  }

  exportAllFilteredExcel(): void {
    this.runExport('excel', true);
  }

  private runExport(format: 'csv' | 'excel', allPages: boolean): void {
    if (!allPages) {
      if (!this.transactions.length) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Nothing to export',
          detail: 'The current page has no results.',
        });
        return;
      }
      this.writeFile(format, this.transactions);
      return;
    }

    const busyFlag =
      format === 'csv' ? 'exportingAllCsv' : 'exportingAllExcel';
    (this as any)[busyFlag] = true;

    this.fetchAllFilteredPages()
      .then((rows) => {
        (this as any)[busyFlag] = false;
        if (!rows.length) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Nothing to export',
            detail: 'No records matched the current filters.',
          });
          return;
        }
        this.writeFile(format, rows);
        this.cdr.detectChanges();
      })
      .catch((err) => {
        (this as any)[busyFlag] = false;
        this.handleApiError(err, 'Export failed');
        this.cdr.detectChanges();
      });
  }

  // Loops pages (bounded by MAX_EXPORT_PAGES) collecting all rows matching current filters.
  private async fetchAllFilteredPages(): Promise<TransactionLookupDto[]> {
    const all: TransactionLookupDto[] = [];
    let page = 0;
    let hasNext = true;

    while (hasNext && page < MAX_EXPORT_PAGES) {
      const searchFilters: TransactionSearchFilters = {
        ...this.filters,
        entityId: this.filters.entityId || this.entityId,
        dateFrom: this.toLocalIso(this.dateFromValue),
        dateTo: this.toLocalIso(this.dateToValue),
        page,
        size: EXPORT_PAGE_SIZE,
        sort: this.sortField,
        direction: this.sortOrder === 1 ? 'ASC' : 'DESC',
      };

      const response = await this.lookupService
        .searchTransactions(searchFilters)
        .toPromise();

      if (!response) break;
      all.push(...response.data);
      hasNext = response.hasNext;
      page += 1;
    }

    if (hasNext && page >= MAX_EXPORT_PAGES) {
      this.messageService.add({
        severity: 'info',
        summary: 'Export capped',
        detail: `Exported the first ${all.length.toLocaleString()} matching records. Narrow your filters to export the rest.`,
      });
    }

    return all;
  }

  private writeFile(format: 'csv' | 'excel', rows: TransactionLookupDto[]): void {
    const exportRows = rows.map((t) => ({
      'Transaction ID': t.id,
      'Receipt Number': t.mpesaReceiptNumber,
      'Customer Name': t.customerName,
      'Phone Number': t.phoneNumber,
      'Username': t.username,
      'Fleet Number': t.fleetNumber,
      'Entity ID': t.entityId,
      'Amount (KES)': t.amount,
      'Payment Status': t.paymentStatus,
      'Payment Type': t.paymentType,
      'Payment Source': t.paymentSource,
      'Transaction Type': t.transactionType,
      'Result Description': t.resultDesc,
      'Created At': t.createdAt,
      'Updated At': t.updatedAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    const stamp = this.toLocalIso(new Date())?.replace(/[:T]/g, '-') ?? Date.now();
    const fileName = `transactions_${stamp}`;

    if (format === 'csv') {
      XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: 'csv' });
    } else {
      XLSX.writeFile(workbook, `${fileName}.xlsx`, { bookType: 'xlsx' });
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Export ready',
      detail: `${rows.length.toLocaleString()} record(s) exported as ${format.toUpperCase()}.`,
    });
  }

  // ================= HELPERS =================
  openInMaps(): void {
    // placeholder
  }

  private handleApiError(err: any, fallbackTitle: string): void {
    const body: ApiErrorResponse | undefined = err?.error;
    const detail =
      body?.message ||
      (body?.errors ? Object.values(body.errors).join(', ') : null) ||
      'Please try again or adjust your filters.';

    console.error(fallbackTitle, err);
    this.messageService.add({
      severity: 'error',
      summary: fallbackTitle,
      detail,
    });
  }
}
