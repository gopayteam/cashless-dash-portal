// pages/wallets/wallet-analytics/wallet-analytics.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
// NOTE: adjust this import path to wherever formatRelativeTime / formatDateLocal
// actually live in your repo — assumed here as a shared utils file.
import {
  TillNumberTariffResponse,
  WalletBalanceItem,
  WalletBalanceSummaryResponse,
  WithdrawalsCollectionsResponse,
} from '../../../../@core/models/wallet/wallet-analytics.model';
import { formatDateLocal, formatRelativeTime } from '../../../../@core/utils/date-time.util';


interface CategoryVisual {
  color: string;
  icon: string;
  label: string;
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  DRIVER: { color: '#F5B754', icon: 'pi-car', label: 'Driver' },
  OFFLOAD: { color: '#22D3EE', icon: 'pi-download', label: 'Offload' },
  PASSENGER_WALLET: { color: '#A78BFA', icon: 'pi-user', label: 'Passenger' },
  CONDUCTOR: { color: '#FB7185', icon: 'pi-users', label: 'Conductor' },
  INVESTOR_WALLET: { color: '#34D399', icon: 'pi-money-bill', label: 'Investor' },
  MARSHAL_WALLET: { color: '#60A5FA', icon: 'pi-shield', label: 'Marshal' },
};

const DEFAULT_VISUAL: CategoryVisual = { color: '#94A3B8', icon: 'pi-wallet', label: 'Other' };

type BalanceRow = WalletBalanceItem & CategoryVisual & { percentage: number };

@Component({
  selector: 'app-wallet-analytics',
  standalone: true,
  imports: [CommonModule, CardModule, TooltipModule, SkeletonModule],
  templateUrl: './wallet-analytics.html',
  styleUrls: ['./wallet-analytics.css'],
})
export class WalletAnalyticsComponent implements OnInit, OnDestroy {
  entityId: string | null = null;

  // ---- Balance summary ----
  totalBalance = 0;
  displayedTotal = 0; // animated counter value bound in the template
  balanceItems: BalanceRow[] = [];
  balanceLoaded = false;
  lastUpdated: string | null = null;

  // ---- Till number tariff ----
  tillTariff: number | null = null;
  tillLoaded = false;

  // ---- Withdrawals / collections (STUB until the real response is shared) ----
  withdrawalsCollections: WithdrawalsCollectionsResponse['data'] | null = null;
  withdrawalsLoaded = false;
  isStubData = true;

  private countUpFrame: number | null = null;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId;
    } else {
      this.router.navigate(['/login']);
      return;
    }

    this.loadBalanceSummary();
    this.loadTillTariff();
    this.loadWithdrawalsCollections();
  }

  ngOnDestroy(): void {
    if (this.countUpFrame) {
      cancelAnimationFrame(this.countUpFrame);
    }
  }

  formatRelative(iso: string): string {
    return formatRelativeTime(iso);
  }

  private loadBalanceSummary(): void {
    this.dataService
      .post<WalletBalanceSummaryResponse>(
        API_ENDPOINTS.WALLET_BALANCE_SUMMARY,
        { entityId: this.entityId },
        'wallet-analytics'
      )
      .subscribe({
        next: (response) => {
          const { total, items } = response.data;
          this.totalBalance = total;
          this.balanceItems = items
            .slice()
            .sort((a, b) => b.totalBalance - a.totalBalance)
            .map((item) => {
              const visual = CATEGORY_VISUALS[item.category] ?? {
                ...DEFAULT_VISUAL,
                label: item.category,
              };
              return {
                ...item,
                ...visual,
                percentage: total > 0 ? (item.totalBalance / total) * 100 : 0,
              };
            });
          this.balanceLoaded = true;
          this.lastUpdated = new Date().toISOString();
          this.animateTotal(total);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load wallet balance summary', err);
          this.balanceLoaded = true;
          this.cdr.detectChanges();
        },
      });
  }

  private loadTillTariff(): void {
    this.dataService
      .post<TillNumberTariffResponse>(
        API_ENDPOINTS.TILL_NUMBER_TARIFFS,
        { entityId: this.entityId },
        'wallet-analytics',
        true
      )
      .subscribe({
        next: (response) => {
          this.tillTariff = response.data.tillNumberTariff;
          this.tillLoaded = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load till number tariff', err);
          this.tillLoaded = true;
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * STUB — the withdrawals-collections response shape hasn't been shared yet.
   * Wired against a best-guess payload below. Once you send the real response,
   * update WithdrawalsCollectionsResponse in wallet-analytics.model.ts and the
   * `next` handler here to match it, then flip nothing else — isStubData will
   * naturally clear once the real call succeeds.
   */
  private loadWithdrawalsCollections(): void {
    this.dataService
      .post<WithdrawalsCollectionsResponse>(
        API_ENDPOINTS.WITHDRAWALS_COLLECTIONS,
        {
          entityId: this.entityId,
          from: formatDateLocal(new Date(new Date().setDate(1))),
          to: formatDateLocal(new Date()),
        },
        'wallet-analytics',
        true
      )
      .subscribe({
        next: (response) => {
          this.withdrawalsCollections = response.data;
          this.isStubData = false;
          this.withdrawalsLoaded = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn(
            'Withdrawals/collections endpoint not wired yet — showing placeholder data',
            err
          );
          this.withdrawalsCollections = {
            totalWithdrawals: 0,
            totalCollections: 0,
            netFlow: 0,
            period: 'This month',
          };
          this.isStubData = true;
          this.withdrawalsLoaded = true;
          this.cdr.detectChanges();
        },
      });
  }

  private animateTotal(target: number): void {
    const duration = 900;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      this.displayedTotal = target * eased;
      this.cdr.detectChanges();
      if (progress < 1) {
        this.countUpFrame = requestAnimationFrame(step);
      } else {
        this.displayedTotal = target;
      }
    };

    this.countUpFrame = requestAnimationFrame(step);
  }
}
