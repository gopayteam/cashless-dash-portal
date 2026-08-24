// pages/statements/withdrawal-statements.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import * as XLSX from 'xlsx';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { Statement } from '../../../../@core/models/statement/statements.model';
import { StatementApiResponse } from '../../../../@core/models/statement/statements_response.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { formatDateLocal } from '../../../../@core/utils/date-time.util';
import { ActionButtonComponent } from '../../../components/action-button/action-button';

interface TransactionTypeOption {
  label: string;
  value: string;
}

interface CategoryOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-withdrawal-statements',
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
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MessageModule,
    ToastModule,
    ActionButtonComponent,
  ],
  templateUrl: './statements.html',
  styleUrls: [
    './statements.css',
    '../../../../styles/modules/_transactions.css',
    '../../transactions/all/all.css'
  ],
  providers: [MessageService],
})
export class WithdrawalStatementsComponent implements OnInit {
  entityId: string | null = null;
  statements: Statement[] = [];
  allStatements: Statement[] = [];
  filteredStatements: Statement[] = [];
  dateRange: Date[] = [];

  // Pagination state
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  searchTerm: string = '';
  selectedTransactionType: string = '';
  selectedCategory: string = '';

  // Dialog state
  displayDetailDialog: boolean = false;
  selectedStatement: Statement | null = null;

  // Summary stats
  totalCredits: number = 0;
  totalDebits: number = 0;
  netBalance: number = 0;
  transactionCount: number = 0;

  // Server-side wallet search
  walletSearchTerm: string = '';
  isSearching = false;
  searchDebounceTimer: any;

  // Filter options
  transactionTypeOptions: TransactionTypeOption[] = [
    { label: 'All Types', value: '' },
    { label: 'Credit', value: 'CREDIT' },
    { label: 'Debit', value: 'DEBIT' },
  ];

  categoryOptions: CategoryOption[] = [
    { label: 'All Categories', value: '' },
    { label: 'Driver', value: 'DRIVER' },
    { label: 'Offload', value: 'OFFLOAD' },
    { label: 'Conductor', value: 'CONDUCTOR' },
    { label: 'Passenger', value: 'PASSENGER_WALLET' },
    { label: 'System', value: 'SYSTEM' },
  ];

  isExporting = false;
  showExportButtons = false;

  toggleExport(): void {
    this.showExportButtons = !this.showExportButtons;
  }

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
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
    this.loadStatements();
  }

  setDefaultDateRange(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    this.dateRange = [lastWeek, today];
  }

  refresh(): void {
    this.loadStatements({ first: this.first, rows: this.rows });
  }

  loadStatements($event?: any): void {
    const [start, end] = this.dateRange;

    if (!start || !end) {
      console.error('Invalid date range');
      return;
    }

    // Handle pagination from PrimeNG lazy load event
    let page = 0;
    let pageSize = this.rows;

    if ($event) {
      page = $event.first / $event.rows;
      pageSize = $event.rows;
      this.first = $event.first;
      this.rows = $event.rows;
    }

    const payload: any = {
      entityId: this.entityId,
      startDate: formatDateLocal(start),
      endDate: formatDateLocal(end),
      page,
      size: pageSize,
    };

    // Add wallet filter if searching
    if (this.walletSearchTerm && this.walletSearchTerm.trim()) {
      payload.walletId = this.walletSearchTerm.trim();
    }

    this.loadingStore.start();

    this.dataService
      .post<StatementApiResponse>(API_ENDPOINTS.WITHDRAWAL_STATEMENTS, payload, 'statements')
      .subscribe({
        next: (response) => {
          this.allStatements = response.data;
          this.totalRecords = response.totalRecords;
          this.calculateStats();
          this.applyClientSideFilters();
          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load withdrawal statements', err);
          this.allStatements = [];
          this.statements = [];
          this.filteredStatements = [];
          this.totalRecords = 0;
          this.loadingStore.stop();
        },
      });
  }

  /**
   * Server-side wallet search with debouncing
   */
  searchByWalletId(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      // Reset pagination when searching
      this.first = 0;
      this.loadStatements({ first: 0, rows: this.rows });
    }, 500);
  }

  /**
   * Clear wallet search and reload all statements
   */
  clearWalletSearch(): void {
    this.walletSearchTerm = '';
    this.first = 0;
    this.loadStatements({ first: 0, rows: this.rows });
  }

  /**
   * Calculate summary statistics from server data
   */
  calculateStats(): void {
    this.totalCredits = this.allStatements
      .filter(s => s.transactionType === 'CREDIT')
      .reduce((sum, s) => sum + s.amount, 0);

    this.totalDebits = this.allStatements
      .filter(s => s.transactionType === 'DEBIT')
      .reduce((sum, s) => sum + s.amount, 0);

    this.netBalance = this.totalCredits - this.totalDebits;
    this.transactionCount = this.allStatements.length;
  }

  /**
   * Apply client-side filters (transaction type, category, general search)
   */
  applyClientSideFilters(): void {
    let filtered = [...this.allStatements];

    // Apply general search filter (for other fields like receipt number, fleet, etc.)
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((statement) => {
        return (
          statement.mpesaReceiptNumber?.toLowerCase().includes(searchLower) ||
          statement.sourceFleet?.toLowerCase().includes(searchLower) ||
          statement.category?.toLowerCase().includes(searchLower) ||
          statement.amount?.toString().includes(searchLower)
        );
      });
    }

    // Apply transaction type filter
    if (this.selectedTransactionType && this.selectedTransactionType !== '') {
      filtered = filtered.filter(
        statement => statement.transactionType === this.selectedTransactionType
      );
    }

    // Apply category filter
    if (this.selectedCategory && this.selectedCategory !== '') {
      filtered = filtered.filter(
        statement => statement.category === this.selectedCategory
      );
    }

    this.filteredStatements = filtered;
    this.statements = filtered;
  }

  /**
   * Client-side filter handlers
   */
  onSearchChange(): void {
    this.applyClientSideFilters();
  }

  onTransactionTypeChange(): void {
    this.applyClientSideFilters();
  }

  onCategoryChange(): void {
    this.applyClientSideFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyClientSideFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedTransactionType = '';
    this.selectedCategory = '';
    this.applyClientSideFilters();
  }

  /**
   * Date range change triggers server reload
   */
  onDateRangeChange(): void {
    this.first = 0;
    this.loadStatements();
  }

  /**
   * Dialog and UI helper methods
   */
  viewStatementDetails(statement: Statement): void {
    this.selectedStatement = statement;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedStatement = null;
  }

  getTransactionTypeClass(type: string): string {
    return type === 'CREDIT' ? 'credit' : 'debit';
  }

  getTransactionTypeIcon(type: string): string {
    return type === 'CREDIT' ? 'pi-arrow-down' : 'pi-arrow-up';
  }

  getCategoryDisplayName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'DRIVER': 'Driver',
      'OFFLOAD': 'Offload',
      'CONDUCTOR': 'Conductor',
      'PASSENGER_WALLET': 'Passenger',
      'SYSTEM': 'System',
      'PARCEL': 'Parcel',
      'MANAGEMENT': 'Management',
    };
    return categoryMap[category] || category;
  }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'DRIVER': 'pi-car',
      'OFFLOAD': 'pi-download',
      'CONDUCTOR': 'pi-users',
      'PASSENGER_WALLET': 'pi-user',
      'SYSTEM': 'pi-cog',
      'PARCEL': 'pi-box',
      'MANAGEMENT': 'pi-briefcase',
    };
    return iconMap[category] || 'pi-wallet';
  }

  getBalanceChangeClass(statement: Statement): string {
    const change = statement.balanceAfter - statement.balanceBefore;
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  }

  getBalanceChange(statement: Statement): number {
    return statement.balanceAfter - statement.balanceBefore;
  }

  exportToExcel(): void {
    if (this.filteredStatements.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No statements to export',
        life: 3000
      });
      return;
    }

    try {
      this.isExporting = true;

      const exportData = this.filteredStatements.map(s => ({
        'Receipt Number': s.mpesaReceiptNumber,
        'Wallet ID': s.walletId,
        'Category': this.getCategoryDisplayName(s.category),
        'Fleet Source': s.sourceFleet,
        'Transaction Type': s.transactionType,
        'Amount (KES)': s.amount,
        'Balance Before': s.balanceBefore,
        'Balance After': s.balanceAfter,
        'Change': this.getBalanceChange(s),
        'Date': new Date(s.createdOn).toLocaleString(),
      }));

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 20 }, // Receipt Number
        { wch: 18 }, // Wallet ID
        { wch: 16 }, // Category
        { wch: 16 }, // Fleet Source
        { wch: 16 }, // Transaction Type
        { wch: 14 }, // Amount
        { wch: 16 }, // Balance Before
        { wch: 16 }, // Balance After
        { wch: 14 }, // Change
        { wch: 22 }, // Date
      ];

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Statements');

      const [start, end] = this.dateRange;
      const startDate = start ? formatDateLocal(start) : 'all';
      const endDate = end ? formatDateLocal(end) : 'time';
      const filename = `withdrawal_statements_${startDate}_to_${endDate}.xlsx`;

      XLSX.writeFile(wb, filename);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Statements exported to Excel successfully',
        life: 4000
      });
    } catch (error) {
      console.error('Failed to export to Excel:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export statements to Excel',
        life: 4000
      });
    } finally {
      this.isExporting = false;
    }
  }

  exportToCSV(): void {
    if (this.filteredStatements.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No statements to export',
        life: 3000
      });
      return;
    }

    try {
      this.isExporting = true;

      const exportData = this.filteredStatements.map(s => ({
        'Receipt Number': s.mpesaReceiptNumber,
        'Wallet ID': s.walletId,
        'Category': this.getCategoryDisplayName(s.category),
        'Fleet Source': s.sourceFleet,
        'Transaction Type': s.transactionType,
        'Amount (KES)': s.amount,
        'Balance Before': s.balanceBefore,
        'Balance After': s.balanceAfter,
        'Change': this.getBalanceChange(s),
        'Date': new Date(s.createdOn).toLocaleString(),
      }));

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      const [start, end] = this.dateRange;
      const startDate = start ? formatDateLocal(start) : 'all';
      const endDate = end ? formatDateLocal(end) : 'time';
      const filename = `withdrawal_statements_${startDate}_to_${endDate}.csv`;

      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Statements exported to CSV successfully',
        life: 4000
      });
    } catch (error) {
      console.error('Failed to export to CSV:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export statements to CSV',
        life: 4000
      });
    } finally {
      this.isExporting = false;
    }
  }
}
