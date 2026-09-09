import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';


import { Observable, forkJoin } from 'rxjs';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { PaymentSourceAmountResponse } from '../../../../@core/models/analytics/payment-source-amount-response.model';
import { WithdrawalsCollectionsResponse } from '../../../../@core/models/analytics/withdrawals-collections-response.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { formatDateLocal } from '../../../../@core/utils/date-time.util';
import { ActionButtonComponent } from '../../../components/action-button/action-button';

type PaymentSource =
  | 'USSD'
  | 'PASSENGER_APP_MPESA_PROMPT'
  | 'PASSENGER_APP_WALLET'
  | 'DRIVER_MPESA_PROMPT'
  | 'SCAN_TO_PAY';

type ViewMode = 'bars' | 'cards' | 'donut';

interface SourceSlice {
  source: PaymentSource;
  displayName: string;
  icon: string;
  amount: number;
  pct: number; // share of source total, 0-100
  color: string;
}

const ALL_SOURCES: PaymentSource[] = [
  'USSD',
  'PASSENGER_APP_MPESA_PROMPT',
  'PASSENGER_APP_WALLET',
  'DRIVER_MPESA_PROMPT',
  'SCAN_TO_PAY',
];

// A muted, coherent palette in place of default saturated primaries — each
// hue reads distinctly at a glance without competing for attention.
const SOURCE_COLORS: Record<PaymentSource, string> = {
  USSD: '#3C6E71',
  PASSENGER_APP_MPESA_PROMPT: '#146356',
  PASSENGER_APP_WALLET: '#5B4B8A',
  DRIVER_MPESA_PROMPT: '#A6491F',
  SCAN_TO_PAY: '#C98A2C',
};

const SOURCE_DISPLAY_NAMES: Record<PaymentSource, string> = {
  USSD: 'USSD',
  PASSENGER_APP_MPESA_PROMPT: 'Passenger App (M-Pesa)',
  PASSENGER_APP_WALLET: 'Passenger App (Wallet)',
  DRIVER_MPESA_PROMPT: 'Driver (M-Pesa)',
  SCAN_TO_PAY: 'Scan to Pay',
};

const SOURCE_ICONS: Record<PaymentSource, string> = {
  USSD: 'pi-hashtag',
  PASSENGER_APP_MPESA_PROMPT: 'pi-user',
  PASSENGER_APP_WALLET: 'pi-wallet',
  DRIVER_MPESA_PROMPT: 'pi-car',
  SCAN_TO_PAY: 'pi-qrcode',
};

@Component({
  selector: 'app-collection-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    DatePickerModule,
    SelectButtonModule,
    SkeletonModule,
    TooltipModule,
    MatFormFieldModule,
    MatDatepickerModule,
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    TooltipModule,
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
  templateUrl: './collection.html',
  styleUrls: ['./collection.css'],
})
export class PaymentsOverviewWidgetComponent implements OnInit {
  entityId: string | null = null;

  // This widget only ever deals in CREDIT (money coming into the system)
  readonly transactionType = 'CREDIT';

  // Single date control that drives every request below
  selectedDate: Date = new Date();
  today: Date = new Date();

  // Collections vs withdrawals
  totalCollected = 0;
  totalWithdrawn = 0;

  // Payment source breakdown
  slices: SourceSlice[] = [];
  totalSourceAmount = 0;

  hasLoaded = false;

  viewOptions: { label: string; value: ViewMode }[] = [
    { label: 'Bars', value: 'bars' },
    { label: 'Cards', value: 'cards' },
    { label: 'Donut', value: 'donut' },
  ];
  viewMode: ViewMode = 'bars';

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  get netDifference(): number {
    return this.totalCollected - this.totalWithdrawn;
  }

  // Diverging bar: each side grows from a centre baseline toward a max
  // half-width of 50%, so collected and withdrawn stay visually comparable.
  get collectedBarPct(): number {
    const max = Math.max(this.totalCollected, this.totalWithdrawn, 1);
    return (this.totalCollected / max) * 50;
  }

  get withdrawnBarPct(): number {
    const max = Math.max(this.totalCollected, this.totalWithdrawn, 1);
    return (this.totalWithdrawn / max) * 50;
  }

  // Builds the conic-gradient background string for the donut view
  get donutGradient(): string {
    let cumulative = 0;
    const stops = this.slices.map((s) => {
      const start = cumulative;
      cumulative += s.pct;
      return `${s.color} ${start}% ${cumulative}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.entityId = user ? user.entityId : null;
    this.fetchAll();
  }

  onDateChange(): void {
    this.fetchAll();
  }

  refresh(): void {
    this.fetchAll(true);
  }

  getSourceDisplayName(source: PaymentSource): string {
    return SOURCE_DISPLAY_NAMES[source] || source;
  }

  getSourceIcon(source: PaymentSource): string {
    return SOURCE_ICONS[source] || 'pi-money-bill';
  }

  private fetchAll(bypassCache: boolean = true): void {
    if (!this.entityId) return;

    this.loadingStore.start();

    const dateStr = formatDateLocal(this.selectedDate);

    const sourceRequests = ALL_SOURCES.reduce((acc, source) => {
      acc[source] = this.dataService.get<PaymentSourceAmountResponse>(
        API_ENDPOINTS.PAYMENT_SOURCE_AMOUNT,
        {
          entityId: this.entityId,
          date: dateStr,
          transactionType: this.transactionType,
          paymentSource: source,
        },
        `payment-source-${source}`,
        bypassCache
      );
      return acc;
    }, {} as Record<PaymentSource, Observable<PaymentSourceAmountResponse>>);

    forkJoin({
      withdrawalsCollections: this.dataService.get<WithdrawalsCollectionsResponse>(
        API_ENDPOINTS.WITHDRAWALS_COLLECTIONS,
        { entityId: this.entityId, date: dateStr },
        'withdrawals-collections',
        bypassCache
      ),
      ...sourceRequests,
    }).subscribe({
      next: (results) => {
        this.totalCollected = results.withdrawalsCollections?.data?.totalAmountCollected ?? 0;
        this.totalWithdrawn = results.withdrawalsCollections?.data?.totalAmountWithdrawn ?? 0;

        const amounts = ALL_SOURCES.map((source) => ({
          source,
          amount: results[source]?.data?.amount ?? 0,
        }));

        this.totalSourceAmount = amounts.reduce((sum, a) => sum + a.amount, 0);

        this.slices = amounts.map((a) => ({
          source: a.source,
          displayName: this.getSourceDisplayName(a.source),
          icon: this.getSourceIcon(a.source),
          amount: a.amount,
          pct: this.totalSourceAmount > 0 ? (a.amount / this.totalSourceAmount) * 100 : 0,
          color: SOURCE_COLORS[a.source],
        }));

        this.hasLoaded = true;
        this.loadingStore.stop();
      },
      error: (err) => {
        console.error('Failed to load payments overview', err);
        this.totalCollected = 0;
        this.totalWithdrawn = 0;
        this.totalSourceAmount = 0;
        this.slices = [];
        this.hasLoaded = true;
        this.loadingStore.stop();
      },
    });
  }
}
