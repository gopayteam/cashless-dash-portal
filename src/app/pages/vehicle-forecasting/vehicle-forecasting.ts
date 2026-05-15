// pages/vehicle-forecast/vehicle-forecast.component.ts
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, interval, of } from 'rxjs';
import { switchMap, takeUntil, takeWhile, catchError } from 'rxjs/operators';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { TabsModule } from 'primeng/tabs';

import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

import { Router } from '@angular/router';
import { AuthService } from '../../../@core/services/auth.service';
import { DataService } from '../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../@core/api/endpoints';
import { VehicleAnalysisService } from '../../../@core/services/vehicle-analysis.service';
import { ForecastService } from '../../../@core/services/forecast.service';
import { TransactionRecord, FREQ_OPTIONS, ModelOption, FORECAST_MODELS, ForecastResponse, ForecastRequest } from '../../../@core/models/forecast/forecast.models';
import { Vehicle } from '../../../@core/models/vehicle/vehicle.model';
import { VehicleApiResponse } from '../../../@core/models/vehicle/vehicle_reponse.model';

declare var Plotly: any;

type PeriodTab = 'day' | 'week' | 'month' | 'year';
interface YearOption { label: string; value: number; }
interface MonthOption { label: string; value: number; }

const MONTHS: MonthOption[] = [
  { label: 'January', value: 1 }, { label: 'February', value: 2 },
  { label: 'March', value: 3 }, { label: 'April', value: 4 },
  { label: 'May', value: 5 }, { label: 'June', value: 6 },
  { label: 'July', value: 7 }, { label: 'August', value: 8 },
  { label: 'September', value: 9 }, { label: 'October', value: 10 },
  { label: 'November', value: 11 }, { label: 'December', value: 12 },
];

@Component({
  standalone: true,
  selector: 'app-vehicle-forecast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SliderModule,
    SelectButtonModule,
    ProgressSpinnerModule,
    ToastModule,
    SkeletonModule,
    TooltipModule,
    MultiSelectModule,
    TabsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSliderModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  templateUrl: './vehicle-forecasting.html',
  styleUrls: ['./vehicle-forecasting.css', '../../../styles/global/_toast.css'],
})
export class VehicleForecastComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  /** Transactions passed in from the parent (e.g. VehicleAnalysisComponent) */
  @Input() transactions: TransactionRecord[] = [];
  /** Optional: single vehicle ID for DB-sourced forecasts */
  @Input() vehicleId?: string;

  @ViewChild('plotlyChart') plotlyChartRef!: ElementRef;

  // ── Auth & Selection State ──────────────────────────────────────────
  entityId: string | null = null;
  allVehicles: Vehicle[] = [];
  selectedFleets: string[] = [];
  fleetOptions: { label: string; value: string }[] = [];
  readonly MAX_FLEETS = 5;

  activeTabValue: PeriodTab = 'week'; // Default to week for better data volume

  // Date selection
  dayDate: Date = new Date();
  weekStartDate: Date = this._addDays(new Date(), -6);
  weekEndDate: Date = new Date();
  monthYear: number = new Date().getFullYear();
  monthMonth: number = new Date().getMonth() + 1;
  yearYear: number = new Date().getFullYear();

  months = MONTHS;
  years: YearOption[] = this._buildYearOptions();

  // ── Config ──────────────────────────────────────────────────────────
  periods = 30;
  freq: 'D' | 'W' | 'MS' = 'D';
  selectedModels: string[] = ['arima', 'prophet', 'random_forest'];

  freqOptions = FREQ_OPTIONS;
  availableModels: ModelOption[] = FORECAST_MODELS;

  // ── State ────────────────────────────────────────────────────────────
  loading = false;
  analysisLoading = false;
  forecastResult: ForecastResponse | null = null;
  chartRendered = false;

  private _destroy$ = new Subject<void>();
  private _pollSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dataService: DataService,
    private analysisService: VehicleAnalysisService,
    private forecastService: ForecastService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) { this.router.navigate(['/login']); return; }
    this.entityId = user.entityId;

    this._loadVehicles();
  }

  ngAfterViewInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions'] && this.transactions.length > 0) {
      // Reset results when input transactions change
      this.forecastResult = null;
      this.chartRendered = false;
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this._pollSub?.unsubscribe();
  }

  // ─────────────────────────────────────────────
  // Load vehicles for multi-select
  // ─────────────────────────────────────────────

  private _loadVehicles(): void {
    const payload = { entityId: this.entityId, page: 0, size: 1000 };
    this.dataService
      .post<VehicleApiResponse>(API_ENDPOINTS.ALL_VEHICLES, payload, 'vehicles', false)
      .subscribe({
        next: (res) => {
          this.allVehicles = res.data;
          this.fleetOptions = res.data.map((v) => ({
            label: `${v.fleetNumber} — ${v.registrationNumber}`,
            value: v.fleetNumber,
          }));
          this.cdr.markForCheck();
        },
        error: () => this.messageService.add({
          severity: 'error', summary: 'Error', detail: 'Failed to load vehicles',
        }),
      });
  }

  // ─────────────────────────────────────────────
  // Fleet selection
  // ─────────────────────────────────────────────

  get canFetch(): boolean {
    return this.selectedFleets.length > 0 && this.selectedFleets.length <= this.MAX_FLEETS;
  }

  onFleetSelectionChange(): void {
    if (this.selectedFleets.length > this.MAX_FLEETS) {
      this.selectedFleets = this.selectedFleets.slice(0, this.MAX_FLEETS);
      this.messageService.add({
        severity: 'warn',
        summary: 'Limit reached',
        detail: `You can compare up to ${this.MAX_FLEETS} fleets`,
      });
    }
    this.transactions = [];
    this.forecastResult = null;
  }

  onTabChange(value: string | any): void {
    this.activeTabValue = value as PeriodTab;
    this.transactions = [];
    this.forecastResult = null;

    // Adjust default periods and freq based on tab
    if (this.activeTabValue === 'day') { this.freq = 'D'; this.periods = 7; }
    else if (this.activeTabValue === 'week') { this.freq = 'D'; this.periods = 14; }
    else if (this.activeTabValue === 'month') { this.freq = 'D'; this.periods = 30; }
    else if (this.activeTabValue === 'year') { this.freq = 'W'; this.periods = 12; }
  }

  onWeekStartChange(): void {
    if (this.weekStartDate) {
      this.weekEndDate = this._addDays(new Date(this.weekStartDate), 6);
      this.cdr.markForCheck();
    }
  }

  // ─────────────────────────────────────────────
  // Run Data Fetch
  // ─────────────────────────────────────────────

  fetchData(): void {
    if (!this.canFetch) {
      this.messageService.add({
        severity: 'warn', summary: 'Select Fleet', detail: 'Please select at least one fleet',
      });
      return;
    }

    this.analysisLoading = true;
    this.transactions = [];
    this.forecastResult = null;
    this.cdr.markForCheck();

    const entityId = this.entityId!;
    const fleets = this.selectedFleets;
    let obs$;

    switch (this.activeTabValue) {
      case 'day':
        obs$ = this.analysisService.fetchTransactions(entityId, fleets, this._fmt(this.dayDate), this._fmt(this.dayDate));
        break;
      case 'week':
        obs$ = this.analysisService.fetchTransactions(entityId, fleets, this._fmt(this.weekStartDate), this._fmt(this.weekEndDate));
        break;
      case 'month': {
        const daysInMonth = new Date(this.monthYear, this.monthMonth, 0).getDate();
        const start = `${this.monthYear}-${String(this.monthMonth).padStart(2, '0')}-01`;
        const end = `${this.monthYear}-${String(this.monthMonth).padStart(2, '0')}-${daysInMonth}`;
        obs$ = this.analysisService.fetchTransactions(entityId, fleets, start, end);
        break;
      }
      case 'year':
        obs$ = this.analysisService.fetchTransactions(entityId, fleets, `${this.yearYear}-01-01`, `${this.yearYear}-12-31`, 10000);
        break;
      default:
        obs$ = of([]);
    }

    obs$.pipe(
      takeUntil(this._destroy$),
      catchError((err) => {
        this.messageService.add({
          severity: 'error', summary: 'Fetch Failed', detail: err?.error?.detail ?? 'Could not load transactions',
        });
        return of([]);
      })
    ).subscribe((res) => {
      this.transactions = res as any[];
      this.analysisLoading = false;
      if (this.transactions.length === 0) {
        this.messageService.add({
          severity: 'info', summary: 'No Data', detail: 'No transactions found for the selected period.',
        });
      }
      this.cdr.markForCheck();
    });
  }

  // ── Computed ─────────────────────────────────────────────────────────

  get canForecast(): boolean {
    return (
      this.transactions.length >= 10 &&
      this.selectedModels.length > 0 &&
      !this.loading
    );
  }

  get insufficientData(): boolean {
    return this.transactions.length > 0 && this.transactions.length < 10;
  }

  get metricEntries(): { key: string; value: number }[] {
    if (!this.forecastResult?.metrics) return [];
    return Object.entries(this.forecastResult.metrics).map(([key, value]) => ({
      key,
      value: typeof value === 'number' ? value : 0,
    }));
  }

  get freqLabel(): string {
    return this.freqOptions.find((f) => f.value === this.freq)?.label ?? this.freq;
  }

  // ── Model toggle ──────────────────────────────────────────────────────

  toggleModel(model: string): void {
    const idx = this.selectedModels.indexOf(model);
    if (idx === -1) {
      this.selectedModels = [...this.selectedModels, model];
    } else {
      if (this.selectedModels.length === 1) return; // keep at least one
      this.selectedModels = this.selectedModels.filter((m) => m !== model);
    }
  }

  isModelSelected(model: string): boolean {
    return this.selectedModels.includes(model);
  }

  // ── Run forecast ──────────────────────────────────────────────────────

  runForecast(): void {
    if (!this.canForecast) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Forecast',
        detail: 'Need at least 10 transaction records and at least one model selected.',
      });
      return;
    }

    this.loading = true;
    this.forecastResult = null;
    this.chartRendered = false;
    this.cdr.markForCheck();

    const request: ForecastRequest = {
      source: 'payload',
      transactions: this.transactions,
      vehicle_id: this.vehicleId || (this.selectedFleets.length > 0 ? this.selectedFleets.join(',') : 'unknown'),
      periods: this.periods,
      freq: this.freq,
      models: this.selectedModels,
      use_cache: false,
    };

    this.forecastService
      .postForecast(request)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 'processing' && res.job_id) {
            this._pollJob(res.job_id);
          } else {
            this._handleResult(res);
          }
        },
        error: (err) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Forecast Failed',
            detail: err?.error?.detail ?? 'An unexpected error occurred.',
          });
          this.cdr.markForCheck();
        },
      });
  }

  private _pollJob(jobId: string): void {
    this._pollSub = interval(3000)
      .pipe(
        switchMap(() => this.forecastService.pollJob(jobId)),
        takeWhile((res) => res.status === 'processing', true),
        takeUntil(this._destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status !== 'processing') {
            this._handleResult(res);
          }
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Polling Failed',
            detail: 'Could not retrieve forecast job result.',
          });
          this.cdr.markForCheck();
        },
      });
  }

  private _handleResult(res: ForecastResponse): void {
    if (res.status === 'failed') {
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Forecast Failed',
        detail: res.error ?? 'Model execution failed.',
      });
      this.cdr.markForCheck();
      return;
    }

    this.forecastResult = res;
    this.loading = false;
    this.cdr.markForCheck();

    // Render Plotly after view updates
    setTimeout(() => this._renderPlotly(), 100);
  }

  private _renderPlotly(): void {
    if (!this.forecastResult?.plotly_json || !this.plotlyChartRef) return;

    try {
      const fig = this.forecastResult.plotly_json;
      const layout = {
        ...(fig.layout ?? {}),
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#94a3b8', family: 'DM Sans, sans-serif' },
        xaxis: {
          ...(fig.layout?.xaxis ?? {}),
          gridcolor: 'rgba(148,163,184,0.1)',
          linecolor: 'rgba(148,163,184,0.2)',
        },
        yaxis: {
          ...(fig.layout?.yaxis ?? {}),
          gridcolor: 'rgba(148,163,184,0.1)',
          linecolor: 'rgba(148,163,184,0.2)',
        },
        legend: { bgcolor: 'transparent' },
        margin: { t: 40, b: 60, l: 60, r: 20 },
      };

      Plotly.newPlot(
        this.plotlyChartRef.nativeElement,
        fig.data ?? [],
        layout,
        { responsive: true, displayModeBar: true, displaylogo: false },
      );
      this.chartRendered = true;
      this.cdr.markForCheck();
    } catch (e) {
      console.error('Plotly render error:', e);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────

  private _fmt(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private _addDays(d: Date, days: number): Date {
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    return result;
  }

  private _buildYearOptions(): YearOption[] {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      label: String(current - i),
      value: current - i,
    }));
  }

  metricLabel(key: string): string {
    const map: Record<string, string> = {
      mae: 'MAE',
      rmse: 'RMSE',
      r2: 'R²',
      r_squared: 'R²',
      mape: 'MAPE',
      mse: 'MSE',
    };
    return map[key.toLowerCase()] ?? key.toUpperCase();
  }

  metricDescription(key: string): string {
    const map: Record<string, string> = {
      mae: 'Mean Absolute Error',
      rmse: 'Root Mean Squared Error',
      r2: 'Coefficient of Determination',
      r_squared: 'Coefficient of Determination',
      mape: 'Mean Absolute Percentage Error',
      mse: 'Mean Squared Error',
    };
    return map[key.toLowerCase()] ?? key;
  }

  metricIcon(key: string): string {
    const map: Record<string, string> = {
      mae: 'pi-chart-line',
      rmse: 'pi-chart-bar',
      r2: 'pi-percentage',
      r_squared: 'pi-percentage',
      mape: 'pi-percentage',
    };
    return map[key.toLowerCase()] ?? 'pi-info-circle';
  }

  formatMetricValue(key: string, value: number): string {
    const k = key.toLowerCase();
    if (k === 'r2' || k === 'r_squared') return value.toFixed(4);
    if (k === 'mape') return `${(value * 100).toFixed(2)}%`;
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}

