import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import * as XLSX from 'xlsx';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { UserWalletItem } from '../../../../@core/models/wallet/user-wallet-item.model';
import { UserWalletsAnalysisResponse } from '../../../../@core/models/wallet/user-wallets-analysis-response.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { ActionButtonComponent } from "../../../components/action-button/action-button";

type WalletCategory = 'DRIVER' | 'OFFLOAD' | 'PASSENGER_WALLET';

@Component({
  selector: 'app-user-wallets-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule,
    SelectModule,
    ActionButtonComponent
],
  templateUrl: './user-wallets-analysis.html',
  styleUrls: ['./user-wallets-analysis.css'],
})
export class UserWalletsAnalysisComponent implements OnInit {
  entityId: string | null = null;

  items: UserWalletItem[] = [];

  isExporting = false;

  // Server-side (lazy) pagination state
  rows: number = 20;
  first: number = 0;
  totalRecords: number = 0;

  // Category is a required single-select param for this endpoint
  categoryOptions: { label: string; value: WalletCategory }[] = [
    { label: 'Driver', value: 'DRIVER' },
    { label: 'Offload', value: 'OFFLOAD' },
    { label: 'Passenger', value: 'PASSENGER_WALLET' },
  ];
  selectedCategory: WalletCategory = 'DRIVER';

  // Keeps track of the last lazy-load event so the refresh button
  // can re-request exactly the page/size the user is currently viewing
  private lastPage: number = 0;
  private lastSize: number = 20;

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
    // Initial load is triggered by the table's own (onLazyLoad) firing on init —
    // no manual call needed here.
  }

  // Fired by PrimeNG whenever the page changes (and on initial render)
  loadWallets(event?: any): void {
    let page = 0;
    let size = this.rows;

    if (event) {
      page = Math.floor(event.first / event.rows);
      size = event.rows;
      this.first = event.first;
      this.rows = event.rows;
    }

    this.lastPage = page;
    this.lastSize = size;

    this.fetchPage(page, size);
  }

  // Manual refresh — re-requests the exact page/size currently displayed
  refresh(): void {
    this.fetchPage(this.lastPage, this.lastSize);
  }

  // Category change resets back to page 0
  onCategoryChange(): void {
    this.first = 0;
    this.lastPage = 0;
    this.fetchPage(0, this.rows);
  }

  private fetchPage(page: number, size: number): void {
    if (!this.entityId) return;

    const params = {
      entityId: this.entityId,
      category: this.selectedCategory,
      page,
      size,
    };

    this.loadingStore.start();

    this.dataService
      .get<UserWalletsAnalysisResponse>(API_ENDPOINTS.USER_WALLETS_ANALYSIS, params, 'user-wallets-analysis')
      .subscribe({
        next: (response) => {
          this.items = response.data.items ?? [];
          this.totalRecords = response.data.totalElements ?? 0;
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load user wallets analysis', err);
          this.items = [];
          this.totalRecords = 0;
          this.loadingStore.stop();
        },
      });
  }

  // ============= EXPORT =============

  /** Maps a page of wallet items to plain export rows. */
  private toExportRows(wallets: UserWalletItem[]) {
    return wallets.map((w) => ({
      'Wallet ID': w.walletId,
      Name: w.name,
      Category: this.getCategoryDisplayName(w.category),
      'Balance (Ksh)': w.balance,
    }));
  }

  /** Export only the items currently visible on the table. */
  exportCurrentPageCSV(): void {
    const rows = this.toExportRows(this.items);
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

      this.downloadBlob(
        new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }),
        `wallets-${this.selectedCategory.toLowerCase()}-page.csv`
      );
    } catch (err) {
      console.error('Failed to export CSV', err);
    } finally {
      this.isExporting = false;
    }
  }

  exportCurrentPageExcel(): void {
    const rows = this.toExportRows(this.items);
    if (rows.length === 0) return;

    this.isExporting = true;
    try {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Wallets');
      XLSX.writeFile(wb, `wallets-${this.selectedCategory.toLowerCase()}-page.xlsx`);
    } catch (err) {
      console.error('Failed to export Excel', err);
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * Fetch every page from the API and bundle all records into a single export.
   * Uses a page size of 500 to minimise round-trips.
   */
  exportAllCSV(): void {
    this._fetchAllAndExport('csv');
  }

  exportAllExcel(): void {
    this._fetchAllAndExport('excel');
  }

  private _fetchAllAndExport(format: 'csv' | 'excel'): void {
    if (!this.entityId || this.totalRecords === 0) return;

    this.isExporting = true;
    const pageSize = 500;
    const totalPages = Math.ceil(this.totalRecords / pageSize);
    const pageRequests: Promise<UserWalletItem[]>[] = [];

    for (let p = 0; p < totalPages; p++) {
      const params = {
        entityId: this.entityId,
        category: this.selectedCategory,
        page: p,
        size: pageSize,
      };

      const promise = new Promise<UserWalletItem[]>((resolve) => {
        this.dataService
          .get<UserWalletsAnalysisResponse>(
            API_ENDPOINTS.USER_WALLETS_ANALYSIS,
            params,
            `user-wallets-analysis-export-${p}`
          )
          .subscribe({
            next: (res) => resolve(res.data.items ?? []),
            error: () => resolve([]),
          });
      });

      pageRequests.push(promise);
    }

    Promise.all(pageRequests).then((pages) => {
      const allItems = pages.flat();
      const rows = this.toExportRows(allItems);
      const filename = `wallets-${this.selectedCategory.toLowerCase()}-all`;

      try {
        if (format === 'csv') {
          const headers = Object.keys(rows[0]);
          const csvContent = [
            headers.join(','),
            ...rows.map((row) =>
              headers
                .map((h) => `"${String((row as any)[h]).replace(/"/g, '""')}"`)
                .join(',')
            ),
          ].join('\n');
          this.downloadBlob(
            new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }),
            `${filename}.csv`
          );
        } else {
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Wallets');
          XLSX.writeFile(wb, `${filename}.xlsx`);
        }
      } catch (err) {
        console.error('Failed to export all wallets', err);
      } finally {
        this.isExporting = false;
      }
    });
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

  getCategoryDisplayName(category: string): string {
    const map: { [key: string]: string } = {
      DRIVER: 'Driver',
      OFFLOAD: 'Offload',
      PASSENGER_WALLET: 'Passenger',
    };
    return map[category] || category;
  }

  getCategoryIcon(category: string): string {
    const map: { [key: string]: string } = {
      DRIVER: 'pi-car',
      OFFLOAD: 'pi-download',
      PASSENGER_WALLET: 'pi-user',
    };
    return map[category] || 'pi-wallet';
  }
}
