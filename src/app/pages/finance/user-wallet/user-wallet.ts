// pages/wallets/all-wallets.component.ts
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
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { Wallet } from '../../../../@core/models/wallet/wallet.model';
import { WalletApiResponse } from '../../../../@core/models/wallet/wallet_reponse.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';

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
  ],
  templateUrl: './user-wallet.html',
  styleUrls: ['./user-wallet.css'],
})
export class UserWallet implements OnInit {
  entityId: string | null = null;
  wallets: Wallet[] = [];
  allWallets: Wallet[] = []; // Store all wallets for filtering

  // Pagination state
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  searchTerm: string = '';

  // Dialog state
  displayDetailDialog: boolean = false;
  selectedWallet: Wallet | null = null;

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

  loadWallets($event?: any): void {
    const event = $event;

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
      page,
      size: pageSize,
    };

    this.loadingStore.start();

    this.dataService
      .post<WalletApiResponse>(API_ENDPOINTS.ALL_WALLETS, payload, 'wallets')
      .subscribe({
        next: (response) => {
          this.allWallets = response.data.walletDetails;
          this.applyClientSideFilter();
          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load wallets', err);
          this.loadingStore.stop();
        },
      });
  }

  applyClientSideFilter(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.wallets = [...this.allWallets];
      this.totalRecords = this.allWallets.length;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();

    this.wallets = this.allWallets.filter((wallet) => {
      return (
        wallet.walletId?.toLowerCase().includes(searchLower) ||
        wallet.category?.toLowerCase().includes(searchLower) ||
        wallet.status?.toLowerCase().includes(searchLower) ||
        wallet.balance?.toString().includes(searchLower)
      );
    });

    this.totalRecords = this.wallets.length;
    this.first = 0; // Reset to first page when filtering
  }

  onSearchChange(): void {
    this.applyClientSideFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyClientSideFilter();
  }

  viewWalletDetails(wallet: Wallet): void {
    this.selectedWallet = wallet;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedWallet = null;
  }

  getCategoryDisplayName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'PASSENGER_WALLET': 'Passenger',
      'CONDUCTOR': 'Conductor',
      'DRIVER': 'Driver',
      'OFFLOAD': 'Offload',
      'INVESTOR_WALLET': 'Investor',
      'MARSHAL_WALLET': 'Marshal'
    };
    return categoryMap[category] || category;
  }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'PASSENGER_WALLET': 'pi-user',
      'CONDUCTOR': 'pi-users',
      'DRIVER': 'pi-car',
      'OFFLOAD': 'pi-download',
      'INVESTOR_WALLET': 'pi-money-bill',
      'MARSHAL_WALLET': 'pi-shield'
    };
    return iconMap[category] || 'pi-wallet';
  }
}
