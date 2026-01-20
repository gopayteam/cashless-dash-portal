// pages/wallets/organization-wallets.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { OrganizationWallet } from '../../../../@core/models/wallet/org_wallet.model';
import { OrganizationWalletApiResponse } from '../../../../@core/models/wallet/org_wallet_response.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-organization-wallets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './organization-wallet.html',
  styleUrls: ['./organization-wallet.css'],
})
export class OrganizationWalletComponent implements OnInit {
  entityId: string | null = null;
  wallets: OrganizationWallet[] = [];
  allWallets: OrganizationWallet[] = [];
  filteredWallets: OrganizationWallet[] = [];

  searchTerm: string = '';

  // Dialog state
  displayDetailDialog: boolean = false;
  selectedWallet: OrganizationWallet | null = null;

  // Summary stats
  totalBalance: number = 0;
  activeWallets: number = 0;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId
      // console.log('Logged in as:', user.username);
    } else {
      this.router.navigate(['/login']);
      console.log('No user logged in');
    }

    this.loadWallets();
  }

  loadWallets(): void {
    const params = {
      size: 200,
      page: 0,
      entityId: this.entityId
    };

    this.loadingStore.start();

    this.dataService
      .get<OrganizationWalletApiResponse>(
        API_ENDPOINTS.ALL_ORGANIZATION_WALLETS,
        params,
        'organization-wallets'
      )
      .subscribe({
        next: (response) => {
          this.allWallets = response.data;
          this.calculateStats();
          this.applyClientSideFilter();
          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load organization wallets', err);
          this.loadingStore.stop();
        },
      });
  }

  calculateStats(): void {
    this.totalBalance = this.allWallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    this.activeWallets = this.allWallets.filter(w => w.status === 'ACTIVE').length;
  }

  applyClientSideFilter(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredWallets = [...this.allWallets];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();

    this.filteredWallets = this.allWallets.filter((wallet) => {
      return (
        wallet.walletId?.toLowerCase().includes(searchLower) ||
        wallet.category?.toLowerCase().includes(searchLower) ||
        wallet.status?.toLowerCase().includes(searchLower) ||
        wallet.entityId?.toLowerCase().includes(searchLower) ||
        wallet.balance?.toString().includes(searchLower)
      );
    });
  }

  onSearchChange(): void {
    this.applyClientSideFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyClientSideFilter();
  }

  viewWalletDetails(wallet: OrganizationWallet): void {
    this.selectedWallet = wallet;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedWallet = null;
  }

  getCategoryDisplayName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'PARCEL': 'Parcel',
      'SYSTEM': 'System',
      'MANAGEMENT': 'Management',
      'OFFLOAD': 'Offload',
      'DRIVER': 'Driver',
      'CONDUCTOR': 'Conductor',
      'PASSENGER_WALLET': 'Passenger',
      'INVESTOR_WALLET': 'Investor',
      'MARSHAL_WALLET': 'Marshal'
    };
    return categoryMap[category] || category;
  }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'PARCEL': 'pi-box',
      'SYSTEM': 'pi-cog',
      'MANAGEMENT': 'pi-briefcase',
      'OFFLOAD': 'pi-download',
      'DRIVER': 'pi-car',
      'CONDUCTOR': 'pi-users',
      'PASSENGER_WALLET': 'pi-user',
      'INVESTOR_WALLET': 'pi-money-bill',
      'MARSHAL_WALLET': 'pi-shield'
    };
    return iconMap[category] || 'pi-wallet';
  }

  getCategoryColor(category: string): string {
    const colorMap: { [key: string]: string } = {
      'PARCEL': '#8b5cf6',
      'SYSTEM': '#3b82f6',
      'MANAGEMENT': '#10b981',
      'OFFLOAD': '#f59e0b',
      'DRIVER': '#ef4444',
      'CONDUCTOR': '#06b6d4',
      'PASSENGER_WALLET': '#ec4899',
      'INVESTOR_WALLET': '#14b8a6',
      'MARSHAL_WALLET': '#6366f1'
    };
    return colorMap[category] || '#64748b';
  }

  getBalanceClass(balance: number): string {
    if (balance > 0) return 'positive';
    if (balance < 0) return 'negative';
    return 'zero';
  }
}
