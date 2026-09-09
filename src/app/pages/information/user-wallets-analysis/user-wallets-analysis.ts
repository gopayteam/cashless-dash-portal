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
