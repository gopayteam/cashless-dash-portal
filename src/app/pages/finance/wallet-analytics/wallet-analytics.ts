// pages/wallets/wallet-analytics/wallet-analytics.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import {
  TillNumberTariffResponse,
  WalletBalanceItem,
  WalletBalanceSummaryResponse,
  WithdrawalsCollectionsResponse,
} from '../../../../@core/models/wallet/wallet-analytics.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import {
  formatDateLocal,
  formatRelativeTime,
} from '../../../../@core/utils/date-time.util';

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

const DEFAULT_VISUAL: CategoryVisual = {
  color: '#94A3B8',
  icon: 'pi-wallet',
  label: 'Other',
};

type BalanceRow = WalletBalanceItem & CategoryVisual & { percentage: number };

@Component({
  selector: 'app-wallet-analytics',
  standalone: true,
  imports: [CommonModule, CardModule, TooltipModule, SkeletonModule, ButtonModule],
  templateUrl: './wallet-analytics.html',
  styleUrls: ['./wallet-analytics.css'],
})
export class WalletAnalyticsComponent implements OnInit, OnDestroy {
  entityId: string | null = null;

  // ---- API environment ----

  /**
   * Component-scoped API environment.
   *
   * true  = Dev API
   * false = Production API
   */
  private _useDev = false;

  /**
   * Change the API environment for this component.
   */
  public setUseDevUrl(useDev: boolean): void {
    this._useDev = useDev;
  }

  /**
   * Get the current API environment.
   */
  public getUseDevUrl(): boolean {
    return this._useDev;
  }

  /**
   * Resolve the API environment for an individual request.
   *
   * A per-request value takes priority over the component setting.
   */
  private resolveUseDev(perCallOverride?: boolean): boolean {
    return perCallOverride !== undefined
      ? perCallOverride
      : this._useDev;
  }

  // ---- Balance summary ----
  totalBalance = 0;
  displayedTotal = 0;
  balanceItems: BalanceRow[] = [];
  balanceLoaded = false;
  lastUpdated: string | null = null;

  // ---- Till number tariff ----
  tillTariff: number | null = null;
  tillLoaded = false;

  // ---- Withdrawals / collections ----
  withdrawalsCollections: WithdrawalsCollectionsResponse['data'] | null = null;
  withdrawalsLoaded = false;
  isStubData = true;

  private countUpFrame: number | null = null;

  get loading() {
    return this.loadingStore.loading;
  }

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

  /**
   * Toggle between Dev and Production API.
   *
   * All analytics requests are reloaded using the
   * newly selected API.
   */
  public toggleApiUrl(): void {
    const newUseDev = !this.getUseDevUrl();

    this.setUseDevUrl(newUseDev);

    this.loadBalanceSummary();
    this.loadTillTariff();
    this.loadWithdrawalsCollections();
  }

  formatRelative(iso: string): string {
    return formatRelativeTime(iso);
  }

  private loadBalanceSummary(useDev?: boolean): void {
    this.dataService
      .post<WalletBalanceSummaryResponse>(
        API_ENDPOINTS.WALLET_BALANCE_SUMMARY,
        { entityId: this.entityId },
        'wallet-analytics',
        true,
        false,
        this.resolveUseDev(useDev)
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
                percentage: total > 0
                  ? (item.totalBalance / total) * 100
                  : 0,
              };
            });

          this.balanceLoaded = true;
          this.lastUpdated = new Date().toISOString();

          this.animateTotal(total);
          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error(
            'Failed to load wallet balance summary',
            err
          );

          this.balanceLoaded = true;
          this.cdr.detectChanges();
        },
      });
  }

  private loadTillTariff(useDev?: boolean): void {
    this.dataService
      .post<TillNumberTariffResponse>(
        API_ENDPOINTS.TILL_NUMBER_TARIFFS,
        { entityId: this.entityId },
        'wallet-analytics',
        true,
        false,
        this.resolveUseDev(useDev)
      )
      .subscribe({
        next: (response) => {
          this.tillTariff = response.data.tillNumberTariff;
          this.tillLoaded = true;
          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error(
            'Failed to load till number tariff',
            err
          );

          this.tillLoaded = true;
          this.cdr.detectChanges();
        },
      });
  }

  private loadWithdrawalsCollections(useDev?: boolean): void {
    this.dataService
      .post<WithdrawalsCollectionsResponse>(
        API_ENDPOINTS.WITHDRAWALS_COLLECTIONS,
        {
          entityId: this.entityId,
          from: formatDateLocal(
            new Date(new Date().setDate(1))
          ),
          to: formatDateLocal(new Date()),
        },
        'wallet-analytics',
        true,
        false,
        this.resolveUseDev(useDev)
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
      const progress = Math.min(
        (now - start) / duration,
        1
      );

      const eased = 1 - Math.pow(1 - progress, 3);

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
