// pages/statements/withdrawal-statements.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { Statement } from '../../../../@core/models/statement/statements.model';
import { StatementApiResponse } from '../../../../@core/models/statement/statements_response.model';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';

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
  ],
  templateUrl: './statements.html',
  styleUrls: [
    './statements.css',
  ],
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
    this.loadStatements();
  }

  setDefaultDateRange(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    this.dateRange = [lastWeek, today];
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
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
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
}
