import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import * as XLSX from 'xlsx';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { Wallet } from '../../../../@core/models/wallet/wallet.model';
import { WalletApiResponse } from '../../../../@core/models/wallet/wallet_reponse.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';


export interface CategoryStat {
  category: string;
  displayName: string;
  icon: string;
  count: number;
  totalBalance: number;
  activeCount: number;
  dormantCount: number;
}

@Component({
  selector: 'app-all-wallets',
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
    MultiSelectModule,
  ],
  templateUrl: './user-wallet.html',
  styleUrls: ['./user-wallet.css'],
})
export class UserWallet implements OnInit {
  entityId: string | null = null;

  // Master dataset (fetched once) and the derived/displayed dataset
  allWallets: Wallet[] = [];
  wallets: Wallet[] = [];

  // Client-side pagination (PrimeNG handles this automatically once [lazy] is removed)
  rows: number = 20;
  first: number = 0;
  totalRecords: number = 0;

  // Max records to pull in a single request — comfortably covers ~12,500 users
  readonly FETCH_SIZE = 15000;

  searchTerm: string = '';

  // Filters
  categoryOptions: { label: string; value: string }[] = [];
  statusOptions: { label: string; value: string }[] = [];
  selectedCategories: string[] = [];
  selectedStatuses: string[] = [];

  // Dialog state
  displayDetailDialog: boolean = false;
  selectedWallet: Wallet | null = null;

  categoryStats: CategoryStat[] = [];
  combinedStat: CategoryStat | null = null;

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
      return;
    }

    this.loadWallets();
  }

  // Fetched once — no more (event) param needed since PrimeNG paginates client-side now
  loadWallets(): void {
    const payload = {
      entityId: this.entityId,
      page: 0,
      size: this.FETCH_SIZE,
    };

    this.loadingStore.start();

    this.dataService
      .post<WalletApiResponse>(API_ENDPOINTS.ALL_WALLETS, payload, 'wallets')
      .subscribe({
        next: (response) => {
          this.allWallets = response.data.walletDetails ?? [];
          this.buildFilterOptions();
          this.applyFilters();
          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load wallets', err);
          this.loadingStore.stop();
        },
      });
  }

  private buildFilterOptions(): void {
    const categories = new Set(this.allWallets.map((w) => w.category));
    this.categoryOptions = Array.from(categories).map((c) => ({
      label: this.getCategoryDisplayName(c),
      value: c,
    }));

    const statuses = new Set(this.allWallets.map((w) => w.status));
    this.statusOptions = Array.from(statuses).map((s) => ({
      label: s,
      value: s,
    }));
  }

  // Combines search + category filter + status filter
  applyFiltersOld(): void {
    let result = [...this.allWallets];

    if (this.selectedCategories.length > 0) {
      result = result.filter((w) => this.selectedCategories.includes(w.category));
    }

    if (this.selectedStatuses.length > 0) {
      result = result.filter((w) => this.selectedStatuses.includes(w.status));
    }

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (wallet) =>
          wallet.walletId?.toLowerCase().includes(searchLower) ||
          wallet.category?.toLowerCase().includes(searchLower) ||
          wallet.status?.toLowerCase().includes(searchLower) ||
          wallet.balance?.toString().includes(searchLower)
      );
    }

    this.wallets = result;
    this.totalRecords = result.length;
    this.first = 0; // reset to first page whenever filters change
  }

  // Combines search + category filter + status filter
  applyFilters(): void {
    let result = [...this.allWallets];

    if (this.selectedCategories.length > 0) {
      result = result.filter((w) => this.selectedCategories.includes(w.category));
    }

    if (this.selectedStatuses.length > 0) {
      result = result.filter((w) => this.selectedStatuses.includes(w.status));
    }

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (wallet) =>
          wallet.walletId?.toLowerCase().includes(searchLower) ||
          wallet.category?.toLowerCase().includes(searchLower) ||
          wallet.status?.toLowerCase().includes(searchLower) ||
          wallet.balance?.toString().includes(searchLower)
      );
    }

    this.wallets = result;
    this.totalRecords = result.length;
    this.first = 0;

    this.buildStatCards();
  }

  // ============= STATS =============

  // Search + status filters only (category filter deliberately excluded so we can
  // show a per-category breakdown even when specific categories are selected)
  private getSearchAndStatusFiltered(): Wallet[] {
    let result = [...this.allWallets];

    if (this.selectedStatuses.length > 0) {
      result = result.filter((w) => this.selectedStatuses.includes(w.status));
    }

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (wallet) =>
          wallet.walletId?.toLowerCase().includes(searchLower) ||
          wallet.category?.toLowerCase().includes(searchLower) ||
          wallet.status?.toLowerCase().includes(searchLower) ||
          wallet.balance?.toString().includes(searchLower)
      );
    }

    return result;
  }

  private computeStats(list: Wallet[]) {
    const activeCount = list.filter((w) => w.status === 'ACTIVE').length;
    const dormantCount = list.length - activeCount;
    const totalBalance = list.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
    return { count: list.length, totalBalance, activeCount, dormantCount };
  }

  private buildStatCards(): void {
    const base = this.getSearchAndStatusFiltered();

    // Which categories get a card: selected ones if any are picked, otherwise all
    const categoriesToShow =
      this.selectedCategories.length > 0
        ? this.selectedCategories
        : Array.from(new Set(this.allWallets.map((w) => w.category)));

    this.categoryStats = categoriesToShow.map((cat) => {
      const list = base.filter((w) => w.category === cat);
      const stats = this.computeStats(list);
      return {
        category: cat,
        displayName: this.getCategoryDisplayName(cat),
        icon: this.getCategoryIcon(cat),
        ...stats,
      };
    });

    // Combined card only makes sense once at least one category is selected —
    // it sums exactly what's currently shown in the table (this.wallets)
    if (this.selectedCategories.length > 0) {
      this.combinedStat = {
        category: 'COMBINED',
        displayName:
          this.selectedCategories.length === 1
            ? this.getCategoryDisplayName(this.selectedCategories[0])
            : `${this.selectedCategories.length} Categories Selected`,
        icon: 'pi-th-large',
        ...this.computeStats(this.wallets),
      };
    } else {
      this.combinedStat = null;
    }
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  onCategoryFilterChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedCategories = [];
    this.selectedStatuses = [];
    this.applyFilters();
  }

  // ============= EXPORT =============

  private getExportRows() {
    // Exports whatever is currently filtered (respects search/category/status)
    return this.wallets.map((w) => ({
      'Wallet ID': w.walletId,
      Category: this.getCategoryDisplayName(w.category),
      Status: w.status,
      'Balance (Ksh)': w.balance,
      'Created At': w.createdAt,
      'Last Updated': w.updatedAt,
    }));
  }

  exportCSV(): void {
    const rows = this.getExportRows();
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => `"${String((row as any)[h]).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `wallets-export-${this.timestamp()}.csv`);
  }

  exportExcel(): void {
    const rows = this.getExportRows();
    if (rows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Wallets');
    XLSX.writeFile(workbook, `wallets-export-${this.timestamp()}.xlsx`);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private timestamp(): string {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  }

  // ============= DIALOG =============

  viewWalletDetails(wallet: Wallet): void {
    this.selectedWallet = wallet;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedWallet = null;
  }

  // ============= DISPLAY HELPERS =============

  getCategoryDisplayName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      PASSENGER_WALLET: 'Passenger',
      CONDUCTOR: 'Conductor',
      DRIVER: 'Driver',
      OFFLOAD: 'Offload',
      INVESTOR_WALLET: 'Investor',
      MARSHAL_WALLET: 'Marshal',
    };
    return categoryMap[category] || category;
  }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      PASSENGER_WALLET: 'pi-user',
      CONDUCTOR: 'pi-users',
      DRIVER: 'pi-car',
      OFFLOAD: 'pi-download',
      INVESTOR_WALLET: 'pi-money-bill',
      MARSHAL_WALLET: 'pi-shield',
    };
    return iconMap[category] || 'pi-wallet';
  }
}
