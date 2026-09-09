import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { forkJoin } from 'rxjs';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { PaymentSourceAmountResponse } from '../../../../@core/models/analytics/payment-source-amount-response.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { formatDateLocal } from '../../../../@core/utils/date-time.util';

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
  pct: number; // share of total, 0-100
  color: string;
}

const ALL_SOURCES: PaymentSource[] = [
  'USSD',
  'PASSENGER_APP_MPESA_PROMPT',
  'PASSENGER_APP_WALLET',
  'DRIVER_MPESA_PROMPT',
  'SCAN_TO_PAY',
];

const SOURCE_COLORS: Record<PaymentSource, string> = {
  USSD: '#4299e1',
  PASSENGER_APP_MPESA_PROMPT: '#38a169',
  PASSENGER_APP_WALLET: '#805ad5',
  DRIVER_MPESA_PROMPT: '#dd6b20',
  SCAN_TO_PAY: '#d53f8c',
};

@Component({
  selector: 'app-payment-source-breakdown-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    DatePickerModule,
    ProgressSpinnerModule,
    SelectButtonModule,
  ],
  templateUrl: './payment-source-breakdown-widget.html',
  styleUrls: ['./payment-source-breakdown-widget.css'],
})
export class PaymentSourceBreakdownWidgetComponent implements OnInit {
  entityId: string | null = null;

  // This widget only ever deals in CREDIT (money coming into the system)
  readonly transactionType = 'CREDIT';

  selectedDate: Date = new Date();
  today: Date = new Date();

  slices: SourceSlice[] = [];
  totalAmount: number = 0;
  hasLoaded: boolean = false;

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

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.entityId = user ? user.entityId : null;
    this.fetchAll();
  }

  onDateChange(): void {
    this.fetchAll();
  }

  refresh(): void {
    this.fetchAll();
  }

  private fetchAll(): void {
    if (!this.entityId) return;

    this.loadingStore.start();

    const dateStr = formatDateLocal(this.selectedDate);

    const requests = ALL_SOURCES.map((source) =>
      this.dataService.get<PaymentSourceAmountResponse>(
        API_ENDPOINTS.PAYMENT_SOURCE_AMOUNT,
        {
          entityId: this.entityId,
          date: dateStr,
          transactionType: this.transactionType,
          paymentSource: source,
        },
        `payment-source-${source}`
      )
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        const amounts = responses.map((r, i) => ({
          source: ALL_SOURCES[i],
          amount: r?.data?.amount ?? 0,
        }));

        this.totalAmount = amounts.reduce((sum, a) => sum + a.amount, 0);

        this.slices = amounts.map((a) => ({
          source: a.source,
          displayName: this.getSourceDisplayName(a.source),
          icon: this.getSourceIcon(a.source),
          amount: a.amount,
          pct: this.totalAmount > 0 ? (a.amount / this.totalAmount) * 100 : 0,
          color: SOURCE_COLORS[a.source],
        }));

        this.hasLoaded = true;
        this.loadingStore.stop();
      },
      error: (err) => {
        console.error('Failed to load payment source breakdown', err);
        this.slices = [];
        this.totalAmount = 0;
        this.hasLoaded = true;
        this.loadingStore.stop();
      },
    });
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

  getSourceDisplayName(source: string): string {
    const map: { [key: string]: string } = {
      USSD: 'USSD',
      PASSENGER_APP_MPESA_PROMPT: 'Passenger App (M-Pesa)',
      PASSENGER_APP_WALLET: 'Passenger App (Wallet)',
      DRIVER_MPESA_PROMPT: 'Driver (M-Pesa)',
      SCAN_TO_PAY: 'Scan to Pay',
    };
    return map[source] || source;
  }

  getSourceIcon(source: string): string {
    const map: { [key: string]: string } = {
      USSD: 'pi-hashtag',
      PASSENGER_APP_MPESA_PROMPT: 'pi-user',
      PASSENGER_APP_WALLET: 'pi-wallet',
      DRIVER_MPESA_PROMPT: 'pi-car',
      SCAN_TO_PAY: 'pi-qrcode',
    };
    return map[source] || 'pi-money-bill';
  }
}
