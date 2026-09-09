import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import * as XLSX from 'xlsx';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { PaymentSourceTransactionResponse } from '../../../../@core/models/transactions/payment-source-transaction-response.model';
import { PaymentSourceTransaction } from '../../../../@core/models/transactions/payment-source-transaction.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { formatDateLocal } from '../../../../@core/utils/date-time.util';
import { ActionButtonComponent } from "../../../components/action-button/action-button";

type PaymentSource =
  | 'USSD'
  | 'PASSENGER_APP_MPESA_PROMPT'
  | 'PASSENGER_APP_WALLET'
  | 'DRIVER_MPESA_PROMPT'
  | 'SCAN_TO_PAY';

export interface PaymentSourceColor {
  primary: string;
  light: string;
  border: string;
  gradient: string;
}

export interface PaymentSourceStat {
  source: string;
  displayName: string;
  icon: string;
  count: number;
  totalAmount: number;
  uniqueFleets: number;
  percentage: number;
  avgTicket: number;
  colors: PaymentSourceColor;
}

@Component({
  selector: 'app-payment-source-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    SkeletonModule,
    ProgressSpinnerModule,
    InputTextModule,
    MultiSelectModule,
    DatePickerModule,
    MatFormFieldModule,
    MatDatepickerModule,
    ActionButtonComponent,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    ProgressSpinnerModule,
    CommonModule,
    FormsModule,
    CardModule,
    ChartModule,
    ButtonModule,
    TableModule,
    TooltipModule,
    A11yModule,

  ],
  templateUrl: './payment-source-transactions.html',
  styleUrls: ['./payment-source-transactions.css',
    '../../../../styles/global/_toast.css',
    '../../../../styles/modules/_filter_actions.css',
  ],
})
export class PaymentSourceTransactionsComponent implements OnInit {
  entityId: string | null = null;

  // Fixed: this endpoint only ever deals in CREDIT transactions
  readonly transactionType = 'CREDIT';

  // Master dataset for the selected date, and the derived/displayed dataset
  allTransactions: PaymentSourceTransaction[] = [];
  transactions: PaymentSourceTransaction[] = [];

  isExporting = false;

  // Client-side pagination (table paginates the in-memory array)
  rows: number = 20;
  first: number = 0;
  totalRecords: number = 0;

  // Date — one API call per date, defaults to today
  selectedDate: Date = new Date();
  today: Date = new Date();

  searchTerm: string = '';

  paymentSourceOptions: { label: string; value: PaymentSource }[] = [
    { label: 'USSD', value: 'USSD' },
    { label: 'M-Pesa', value: 'PASSENGER_APP_MPESA_PROMPT' },
    { label: 'Passenger App (Wallet)', value: 'PASSENGER_APP_WALLET' },
    { label: 'Driver M-Pesa Prompt', value: 'DRIVER_MPESA_PROMPT' },
    { label: 'Scan to Pay', value: 'SCAN_TO_PAY' },
  ];
  selectedPaymentSources: PaymentSource[] = [];

  // Stat cards
  sourceStats: PaymentSourceStat[] = [];
  combinedStat: PaymentSourceStat | null = null;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private router: Router
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
      return;
    }

    this.loadTransactions();
  }

  toggleRefresh(): void {
    this.loadTransactions(true);
  }

  // Called on init and whenever the date picker changes
  loadTransactions(bypassCache: boolean = false): void {
    if (!this.entityId) return;

    const params = {
      entityId: this.entityId,
      date: formatDateLocal(this.selectedDate),
      transactionType: this.transactionType,
      // NOTE: this endpoint currently ignores paymentSource server-side filtering
      // in a meaningful pagination sense (backend returns everything for the date
      // regardless of filters actually applied downstream) — see TODO below.
    };

    this.loadingStore.start();

    this.dataService
      .get<PaymentSourceTransactionResponse>(
        API_ENDPOINTS.PAYMENT_SOURCE_TRANSACTIONS,
        params,
        'payment-source-transactions',
        bypassCache,
      )
      .subscribe({
        next: (response) => {
          this.allTransactions = response.data ?? [];
          this.applyFilters();
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load payment source transactions', err);
          this.allTransactions = [];
          this.applyFilters();
          this.loadingStore.stop();
        },
      });
  }

  onDateChange(): void {
    this.loadTransactions();
  }

  // ============= CLIENT-SIDE FILTER/PAGINATION STUB =============
  // TODO: once the backend paginates this endpoint (page/size + totalElements),
  // replace this client-side filtering with true lazy loading, the same way
  // the user-wallets-analysis component works. Everything below this point
  // is written to be swapped out with minimal changes once that lands —
  // applyFilters()/buildStatCards() are the only two methods that would need
  // to move server-side.

  applyFilters(): void {
    let result = [...this.allTransactions];

    if (this.selectedPaymentSources.length > 0) {
      result = result.filter((t) => this.selectedPaymentSources.includes(t.paymentSource as PaymentSource));
    }

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.fleetNumber?.toLowerCase().includes(searchLower) ||
          t.transactionId?.toLowerCase().includes(searchLower) ||
          t.paymentSource?.toLowerCase().includes(searchLower)
      );
    }

    this.transactions = result;
    this.totalRecords = result.length;
    this.first = 0;

    this.buildStatCards();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  onPaymentSourceFilterChange(): void {
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedPaymentSources = [];
    this.applyFilters();
  }

  // ============= STATS =============

  private getSearchFiltered(): PaymentSourceTransaction[] {
    let result = [...this.allTransactions];

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.fleetNumber?.toLowerCase().includes(searchLower) ||
          t.transactionId?.toLowerCase().includes(searchLower) ||
          t.paymentSource?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }

  private computeStats(list: PaymentSourceTransaction[]) {
    const totalAmount = list.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const uniqueFleets = new Set(list.map((t) => t.fleetNumber)).size;
    const avgTicket = list.length > 0 ? Math.round(totalAmount / list.length) : 0;
    return { count: list.length, totalAmount, uniqueFleets, avgTicket };
  }

  getSourceColors(source: string): PaymentSourceColor {
    const map: Record<string, PaymentSourceColor> = {
      PASSENGER_APP_MPESA_PROMPT: {
        primary: '#059669',
        light: '#ecfdf5',
        border: '#a7f3d0',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      },
      PASSENGER_APP_WALLET: {
        primary: '#7c3aed',
        light: '#f5f3ff',
        border: '#ddd6fe',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      },
      DRIVER_MPESA_PROMPT: {
        primary: '#ea580c',
        light: '#fff7ed',
        border: '#fed7aa',
        gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      },
      USSD: {
        primary: '#0284c7',
        light: '#f0f9ff',
        border: '#bae6fd',
        gradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
      },
      SCAN_TO_PAY: {
        primary: '#d97706',
        light: '#fffbeb',
        border: '#fde68a',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      },
      COMBINED: {
        primary: '#4f46e5',
        light: '#eef2ff',
        border: '#c7d2fe',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
      },
      TOTAL: {
        primary: '#2563eb',
        light: '#eff6ff',
        border: '#bfdbfe',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      },
    };

    return (
      map[source] || {
        primary: '#475569',
        light: '#f8fafc',
        border: '#e2e8f0',
        gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      }
    );
  }

  private buildStatCards(): void {
    const base = this.getSearchFiltered();
    const overallStats = this.computeStats(base);

    const orderedSources: PaymentSource[] = [
      'PASSENGER_APP_MPESA_PROMPT',
      'PASSENGER_APP_WALLET',
      'DRIVER_MPESA_PROMPT',
      'USSD',
      'SCAN_TO_PAY',
    ];

    const presentSources = Array.from(new Set(this.allTransactions.map((t) => t.paymentSource))) as PaymentSource[];

    const sourcesToShow: PaymentSource[] =
      this.selectedPaymentSources.length > 0
        ? this.selectedPaymentSources
        : [
            ...orderedSources.filter((s) => presentSources.includes(s)),
            ...presentSources.filter((s) => !orderedSources.includes(s)),
          ];

    this.sourceStats = sourcesToShow.map((src) => {
      const list = base.filter((t) => t.paymentSource === src);
      const stats = this.computeStats(list);
      const percentage =
        overallStats.totalAmount > 0
          ? (stats.totalAmount / overallStats.totalAmount) * 100
          : 0;

      return {
        source: src,
        displayName: this.getSourceDisplayName(src),
        icon: this.getSourceIcon(src),
        percentage,
        colors: this.getSourceColors(src),
        ...stats,
      };
    });

    if (this.selectedPaymentSources.length > 0) {
      const selectedStats = this.computeStats(this.transactions);
      const percentage =
        overallStats.totalAmount > 0
          ? (selectedStats.totalAmount / overallStats.totalAmount) * 100
          : 100;

      this.combinedStat = {
        source: 'COMBINED',
        displayName:
          this.selectedPaymentSources.length === 1
            ? `${this.getSourceDisplayName(this.selectedPaymentSources[0])}`
            : `${this.selectedPaymentSources.length} Sources Combined`,
        icon: 'pi-filter',
        percentage,
        colors: this.getSourceColors('COMBINED'),
        ...selectedStats,
      };
    } else if (this.allTransactions.length > 0) {
      this.combinedStat = {
        source: 'TOTAL',
        displayName: 'Total Revenue',
        icon: 'pi-chart-line',
        percentage: 100,
        colors: this.getSourceColors('TOTAL'),
        ...overallStats,
      };
    } else {
      this.combinedStat = null;
    }
  }

  // ============= EXPORT =============

  private getExportRows() {
    return this.transactions.map((t) => ({
      'Transaction ID': t.transactionId,
      'Fleet Number': t.fleetNumber,
      'Payment Source': this.getSourceDisplayName(t.paymentSource),
      'Amount (Ksh)': t.amount,
      Date: formatDateLocal(this.selectedDate),
    }));
  }

  exportCSV(): void {
    const rows = this.getExportRows();

    if (rows.length === 0) return;

    this.isExporting = true;

    try {
      const headers = Object.keys(rows[0]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          headers
            .map((h) => `"${String((row as any)[h]).replace(/"/g, '""')}"`)
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });

      this.downloadBlob(
        blob,
        `payment-source-transactions-${formatDateLocal(this.selectedDate)}.csv`
      );
    } catch (error) {
      console.error('Failed to export CSV', error);
    } finally {
      this.isExporting = false;
    }
  }

  exportExcel(): void {
    const rows = this.getExportRows();

    if (rows.length === 0) return;

    this.isExporting = true;

    try {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Transactions'
      );

      XLSX.writeFile(
        workbook,
        `payment-source-transactions-${formatDateLocal(this.selectedDate)}.xlsx`
      );
    } catch (error) {
      console.error('Failed to export Excel', error);
    } finally {
      this.isExporting = false;
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // ============= DISPLAY HELPERS =============

  getSourceDisplayName(source: string): string {
    const map: { [key: string]: string } = {
      USSD: 'USSD',
      PASSENGER_APP_MPESA_PROMPT: 'Passenger App (M-Pesa)',
      PASSENGER_APP_WALLET: 'Passenger App (Wallet)',
      DRIVER_MPESA_PROMPT: 'Driver (M-Pesa)',
      SCAN_TO_PAY: 'Scan to Pay',
    };
    return map[source] || source;
  }

  getSourceIcon(source: string): string {
    const map: { [key: string]: string } = {
      USSD: 'pi-hashtag',
      PASSENGER_APP_MPESA_PROMPT: 'pi-user',
      PASSENGER_APP_WALLET: 'pi-wallet',
      DRIVER_MPESA_PROMPT: 'pi-car',
      SCAN_TO_PAY: 'pi-qrcode',
    };
    return map[source] || 'pi-money-bill';
  }
}
