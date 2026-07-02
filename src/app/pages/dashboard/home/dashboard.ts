// pages/dashboard/dashboard.component.ts
import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';

import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  buildLineChart,
  buildLineChartOptions,
  buildPieChart,
  buildPieChartOptions,
  mapStatsToCards,
  StatsCard,
} from '../../../../@core/mappers/dashboard.mapper';
import {
  TransactionStats,
  TransactionStatsByPeriod,
  TransactionStatsPerCategory
} from '../../../../@core/models/dashboard/dashboard.models';
import { GeneralDriverAssignment } from '../../../../@core/models/driver_assignment/driver_assignment.model';
import {
  ActiveDriverAssignmentApiResponse,
  DriverAssignmentApiResponse,
  PendingDriverAssignmentApiResponse,
  RejectedDriverAssignmentApiResponse,
} from '../../../../@core/models/driver_assignment/driver_assignment_response.mode';
import { Parcel } from '../../../../@core/models/parcels/parcel.model';
import { ParcelsAPiResponse } from '../../../../@core/models/parcels/parcel_response.model';
import { PaymentsApiResponse } from '../../../../@core/models/transactions/payment_reponse.model';
import { PaymentRecord, PaymentRecordVM } from '../../../../@core/models/transactions/transactions.models';
import { Vehicle } from '../../../../@core/models/vehicle/vehicle.model';
import { VehicleApiResponse } from '../../../../@core/models/vehicle/vehicle_reponse.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { ThemeService } from '../../../../@core/services/theme.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { formatDateLocal, formatRelativeTime } from '../../../../@core/utils/date-time.util';
import { ChatWidgetComponent } from "../../../components/chat-widget/chat-widget";

@Component({
  imports: [
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
    ChatWidgetComponent
  ],
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: [
    './dashboard.css',
    '../../../../styles/modules/_cards.css'
  ],
})
export class DashboardComponent implements OnInit {
  statsCards: StatsCard[] = [];
  chartData: any;
  chartOptions: any;
  pieChartData: any;
  pieChartOptions: any;
  dateRange: Date[] = [];
  recentTransactions: PaymentRecord[] | PaymentRecordVM[] = [];
  entityId: string = '';

  // pagination state
  rows: number = 5;
  first: number = 0;
  totalRecords: number = 0;

  // New State variables for Enhanced Dashboard
  selectedTab: 'revenue' | 'fleet' | 'parcels' = 'revenue';

  /**
   * Entity flags — only one parcel-capable entity exists (GS000002).
   * GS000007 (Salty) gets Revenue + Fleet only, same as GS000006.
   */
  isSuperMetro: boolean = false;   // GS000002 — shows Parcel Logistics tab
  isSalty: boolean = false;        // GS000007 — lime-green brand, no parcels

  // Vehicles data & trends
  allVehicles: Vehicle[] = [];
  vehicleStats = { total: 0, active: 0, inactive: 0, capacity: 0 };
  vehiclesTrendData: any;
  vehiclesTrendOptions: any;

  // FIX #1/#2: renamed from "singleDayVehiclesCount" concept split into
  // clearer, non-duplicated fields. No "Activated" count exists separately
  // from "Registered" because the API has no activation timestamp — only
  // createdOn. We now expose ONE registered count + ONE currently-active count.
  singleDayVehiclesRegisteredCount: number = 0;
  singleDayVehiclesList: Vehicle[] = [];
  singleDayActiveVehiclesCount: number = 0; // of vehicles registered that day, how many are currently ACTIVE

  // Whether the selected single-day snapshot actually corresponds to "today"
  // FIX #11: label should not always imply "today" when it's really "the
  // last day of the selected range".
  singleDayIsToday: boolean = false;

  // Parcels data & trends (GS000002 only)
  allParcels: Parcel[] = [];
  // FIX #5/#6/#14: totals/amount/cash/cashless now sourced from backend
  // aggregate fields (totalItems, totalAmount, totalCash, totalCashLess)
  // instead of being recomputed client-side from a possibly-truncated page.
  parcelStats = { total: 0, collected: 0, amount: 0, cash: 0, cashless: 0 };
  parcelsTrendData: any;
  parcelsTrendOptions: any;
  singleDayParcelsCount: number = 0;
  singleDayParcelsList: Parcel[] = [];

  // Which parcel-tab card is currently driving the trend chart.
  // Vehicle Operations chart intentionally does NOT support this — it stays
  // fixed on "Vehicles Registered" per request.
  selectedParcelMetric: 'registered' | 'collected' | 'revenue' | 'payment' = 'collected';
  parcelsTrendTitle: string = 'Parcel Collection Trend';

  // Precomputed daily buckets for every parcel metric, built once per data
  // load in buildParcelsTrend(). Switching cards just re-renders the chart
  // from these — no refetch needed.
  private parcelsDailyMetrics: {
    labels: string[];
    registered: number[];
    collected: number[];
    revenue: number[];
    cash: number[];
    cashless: number[];
  } | null = null;

  singleDayLabel: string = '';

  // ── Driver Assignment Stats (Fleet Operations tab) ────────────────────────
  // Tallies come straight from each endpoint's `totalRecords` — we request
  // size:1 since we only need the count, not the rows, keeping this cheap.
  assignmentStats = { total: 0, active: 0, inactive: 0, pending: 0, rejected: 0 };
  assignmentStatsLoaded: boolean = false;

  // ── Full assignment list — lazy-loaded once, then cached ──────────────────
  // Not tied to the dashboard date range (assignments aren't date-scoped the
  // same way). Fetched on first vehicle search rather than on every dashboard
  // load, and reused afterwards via the data service's cache (bypassCache:
  // false) so repeated searches don't re-hit the network.
  private allDriverAssignments: GeneralDriverAssignment[] = [];
  private assignmentsListLoaded: boolean = false;

  // ── Vehicle search (Fleet Operations tab) ─────────────────────────────────
  vehicleSearchTerm: string = '';
  vehicleSearchAttempted: boolean = false;
  vehicleSearchLoading: boolean = false;
  vehicleSearchResult: Vehicle | null = null;
  vehicleSearchAssignment: GeneralDriverAssignment | null = null;

  constructor(
    private dataService: DataService,
    private router: Router,
    public loadingStore: LoadingStore,
    private themeService: ThemeService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) { }

  // Expose loading signal to template
  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.entityId = user.entityId;

    // ── Entity flags ────────────────────────────────────────────────────────
    this.isSuperMetro = this.entityId === 'GS000002' || this.entityId === 'GS0000002';
    this.isSalty = this.entityId === 'GS000007';
    // ────────────────────────────────────────────────────────────────────────

    this.themeService.applyTheme(user.entityId);
    this.themeService.loadPersistedTheme();

    this.setDateRange();

    // Driver assignment stats aren't date-scoped, so load them once here
    // rather than inside loadDashboardData() (which reruns on every date
    // range change).
    this.loadAssignmentStats();

    // 🔥 FIRST LOAD
    const event = { first: 0, rows: this.rows };
    this.loadDashboardData();
    this.loadTransactions(event);
  }

  loadTransactions($event: any): void {
    if (!this.dateRange || this.dateRange.length < 2) {
      return;
    }

    const [start, end] = this.dateRange;
    const event = $event;
    const page = event.first / event.rows;

    this.rows = event.rows;
    this.first = event.first;

    const payload = {
      entityId: this.entityId,
      startDate: formatDateLocal(start),
      endDate: formatDateLocal(end),
      page,
      size: event.rows,
      paymentStatus: 'PAID',
      transactionType: 'CREDIT',
      sort: 'createdAt,DESC',
    };

    this.dataService
      .post<PaymentsApiResponse>(API_ENDPOINTS.ALL_PAYMENTS, payload, 'transactions')
      .subscribe({
        next: (response) => {
          this.recentTransactions = this.mapPaymentRecords(response.data.manifest);
          this.totalRecords = response.data.totalRecords;
          this.rows = event.rows;
          this.first = event.first;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Recent Transaction load failed', err),
      });
  }

  mapPaymentRecords(records: PaymentRecord[]): PaymentRecordVM[] {
    return records.map((r) => ({
      ...r,
      createdAtFormatted: formatRelativeTime(r.createdAt),
      updatedAtFormatted: formatRelativeTime(r.updatedAt),
    }));
  }

  loadDashboardData(): void {
    if (!this.dateRange || this.dateRange.length < 2) {
      return;
    }

    this.loadingStore.start();

    const [start, end] = this.dateRange;
    this.singleDayLabel = this.formatDateToReadable(end);

    // FIX #11: determine if the selected end date is actually today, so the
    // template can say "Today" vs the literal date without implying activity
    // always happens on the calendar's "today".
    const today = new Date();
    this.singleDayIsToday = formatDateLocal(end) === formatDateLocal(today);

    const baseParams = {
      entityId: this.entityId,
      startDate: formatDateLocal(start),
      endDate: formatDateLocal(end),
    };

    const transactionsPayload = {
      ...baseParams,
      page: 0,
      size: this.rows,
      paymentStatus: 'PAID',
      transactionType: 'CREDIT',
      sort: 'createdAt,DESC',
    };

    forkJoin({
      transaction_stats: this.dataService.get<TransactionStats>(
        API_ENDPOINTS.TRANSACTION_STATS,
        baseParams,
        'stats',
      ),
      transaction_stats_by_period: this.dataService.get<TransactionStatsByPeriod[]>(
        API_ENDPOINTS.STATS_BY_PERIOD,
        { ...baseParams, periodType: 'DAILY' },
        'daily'
      ),
      transaction_stats_per_category: this.dataService.get<TransactionStatsPerCategory[]>(
        API_ENDPOINTS.STATS_PER_CATEGORY,
        baseParams,
        'categories',
      ),
      recentTransactions: this.dataService.post<PaymentsApiResponse>(
        API_ENDPOINTS.ALL_PAYMENTS,
        transactionsPayload,
        'transactions',
      ),
      // NOTE (FIX #7 / #15): ideally this endpoint accepts startDate/endDate
      // like ALL_PARCELS does, so we're not pulling the entire historic
      // fleet just to build a 7-day trend. Left as-is here since we don't
      // have confirmation the backend supports it yet — flagged for backend
      // follow-up. size:5000 is a soft cap; see FIX #7 below for how we now
      // guard against it silently under-reporting totals.
      vehicles: this.dataService.post<VehicleApiResponse>(
        API_ENDPOINTS.ALL_VEHICLES,
        { entityId: this.entityId, page: 0, size: 5000 },
        'vehicles'
      ),
      // Parcels are fetched only for Super Metro (GS000002).
      // GS000007 (Salty) does not use the parcel logistics tab.
      parcels: this.isSuperMetro
        ? this.dataService.post<ParcelsAPiResponse>(
          API_ENDPOINTS.ALL_PARCELS,
          {
            entityId: this.entityId,
            page: 0,
            size: 5000,
            paymentStatus: 'PAID',
            startDate: formatDateLocal(start),
            endDate: formatDateLocal(end),
            sort: 'createdAt,DESC',
          },
          'parcels'
        )
        : of(null)
    }).subscribe({
      next: (data: any) => {
        // Cards
        this.statsCards = mapStatsToCards(data.transaction_stats);

        // Line chart
        this.chartData = buildLineChart(data.transaction_stats_by_period);
        this.chartOptions = buildLineChartOptions();

        // Pie chart
        this.pieChartData = buildPieChart(data.transaction_stats_per_category);
        this.pieChartOptions = buildPieChartOptions();

        // Set transactions
        const response = data.recentTransactions;
        this.recentTransactions = response.data.manifest;
        this.totalRecords = response.data.totalRecords;

        // Vehicle details & trend processing
        const days = this.getDaysArray(start, end);
        this.allVehicles = data.vehicles?.data || [];
        // FIX #7: pass the authoritative totalRecords from the API alongside
        // the fetched array, so "Total Registered Fleet" reflects the true
        // count even if the page size (5000) ever falls short of it.
        this.buildVehiclesTrend(this.allVehicles, days, data.vehicles?.totalRecords);

        // Parcel details & trend processing (GS000002 only)
        if (this.isSuperMetro && data.parcels) {
          this.allParcels = data.parcels.parcels || [];
          this.buildParcelsTrend(this.allParcels, days, data.parcels);
        } else {
          this.parcelStats = { total: 0, collected: 0, amount: 0, cash: 0, cashless: 0 };
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dashboard load failed', err);
        this.loadingStore.stop();
      },
      complete: () => this.loadingStore.stop(),
    });
  }

  selectTab(tab: 'revenue' | 'fleet' | 'parcels'): void {
    this.selectedTab = tab;
    this.cdr.detectChanges();
  }

  getDaysArray(start: Date, end: Date): string[] {
    const arr: string[] = [];
    const dt = new Date(start);
    while (dt <= end) {
      arr.push(formatDateLocal(dt));
      dt.setDate(dt.getDate() + 1);
    }
    return arr;
  }

  formatDateToReadable(date: Date): string {
    return date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /**
   * FIX #8: timezone-safe day parser. Explicitly anchors to local midnight
   * instead of letting `new Date("2026-06-24")` be interpreted as UTC
   * midnight, which some browsers then shift back a day in negative-UTC-
   * offset timezones.
   */
  private parseLocalDay(day: string): Date {
    return new Date(`${day}T00:00:00`);
  }

  buildVehiclesTrend(vehicles: Vehicle[], days: string[], apiTotalRecords?: number) {
    const countsMap = new Map<string, number>();
    days.forEach(day => countsMap.set(day, 0));

    vehicles.forEach(v => {
      if (v.createdOn) {
        // Handles both "2026-06-24T.." and "2026-06-24 .." formats.
        const dateStr = v.createdOn.split(/[ T]/)[0];
        if (countsMap.has(dateStr)) {
          countsMap.set(dateStr, countsMap.get(dateStr)! + 1);
        }
      }
    });

    const trendData = days.map(day => countsMap.get(day) || 0);

    const selectedDayStr = days[days.length - 1];

    // FIX #2: single source of truth for "registered that day" — no
    // separate "Activated" count that duplicates it.
    this.singleDayVehiclesRegisteredCount = countsMap.get(selectedDayStr) || 0;
    this.singleDayVehiclesList = vehicles.filter(
      v => v.createdOn && v.createdOn.split(/[ T]/)[0] === selectedDayStr
    );

    // FIX #3: explicitly documented as "of vehicles registered that day,
    // how many are CURRENTLY active" — not "activated that day". True
    // activation-date tracking would require the backend to expose an
    // activatedAt/statusChangedAt timestamp.
    this.singleDayActiveVehiclesCount = this.singleDayVehiclesList.filter(
      v => v.status === 'ACTIVE'
    ).length;

    const active = vehicles.filter(v => v.status === 'ACTIVE').length;
    // FIX #9: kept as "everything non-ACTIVE counts as inactive" for now —
    // if the backend introduces PENDING/MAINTENANCE/SUSPENDED/ARCHIVED and
    // those should NOT count as "inactive", change this to an explicit
    // allow-list, e.g.:
    //   const inactive = vehicles.filter(v => ['INACTIVE','BLOCKED'].includes(v.status)).length;
    const inactive = vehicles.filter(v => v.status !== 'ACTIVE').length;

    // FIX #7: prefer the API's authoritative totalRecords over the length of
    // the fetched page, so this stays correct even if size:5000 is ever
    // insufficient. Falls back to vehicles.length if the API doesn't return it.
    const total = apiTotalRecords ?? vehicles.length;

    // FIX #10: using `capacity` as authoritative (not seatedCapacity +
    // standingCapacity) — confirm with the business this is the intended
    // field; some records have seatedCapacity/standingCapacity as 0 or null
    // while capacity is populated.
    const capacity = vehicles.reduce((sum, v) => sum + (v.capacity || 0), 0);

    this.vehicleStats = { total, active, inactive, capacity };

    this.vehiclesTrendData = {
      labels: days.map(day => {
        const date = this.parseLocalDay(day);
        return date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' });
      }),
      datasets: [
        {
          // FIX #1: renamed — this is creation/registration data, not
          // activation data (the API has no activation timestamp).
          label: 'Vehicles Registered',
          data: trendData,
          fill: true,
          borderColor: '#198754',
          backgroundColor: 'rgba(25,135,84,0.1)',
          tension: 0.3,
          borderWidth: 2,
          pointBackgroundColor: '#198754',
          pointHoverRadius: 6
        }
      ]
    };

    this.vehiclesTrendOptions = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              // FIX #1: label matches the dataset — "Registered", not "Activated".
              return `Registered: ${context.parsed.y} vehicles`;
            },
          },
        },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    };
  }

  buildParcelsTrend(parcels: Parcel[], days: string[], apiResponse?: any) {
    const collectedCountMap = new Map<string, number>();
    const registeredCountMap = new Map<string, number>();
    const revenueMap = new Map<string, number>();
    const cashMap = new Map<string, number>();
    const cashlessMap = new Map<string, number>();
    days.forEach(day => {
      collectedCountMap.set(day, 0);
      registeredCountMap.set(day, 0);
      revenueMap.set(day, 0);
      cashMap.set(day, 0);
      cashlessMap.set(day, 0);
    });

    parcels.forEach(p => {
      // "Registered" and money metrics are bucketed by createdAt — the day
      // the parcel entered the system, which is what "registered" means
      // and is the only date every parcel has regardless of status.
      if (p.createdAt) {
        const createdDateStr = p.createdAt.split(/[ T]/)[0];
        if (registeredCountMap.has(createdDateStr)) {
          registeredCountMap.set(createdDateStr, registeredCountMap.get(createdDateStr)! + 1);
          revenueMap.set(createdDateStr, revenueMap.get(createdDateStr)! + (p.amount || 0));
          if (p.paymentMethod === 'CASH') {
            cashMap.set(createdDateStr, cashMap.get(createdDateStr)! + (p.amount || 0));
          } else if (p.paymentMethod === 'CASHLESS') {
            cashlessMap.set(createdDateStr, cashlessMap.get(createdDateStr)! + (p.amount || 0));
          }
        }
      }

      // FIX #4: "Collected" is bucketed by pickedAt (falling back to
      // createdAt only for legacy rows missing it), and strictly requires
      // parcelStatus === 'COLLECTED'.
      if (p.parcelStatus === 'COLLECTED') {
        const collectedDateStr = (p.pickedAt || p.createdAt).split(/[ T]/)[0];
        if (collectedCountMap.has(collectedDateStr)) {
          collectedCountMap.set(collectedDateStr, collectedCountMap.get(collectedDateStr)! + 1);
        }
      }
    });

    // Single-day "Collections on X" panel — unchanged behavior, still tied
    // to actual collection date regardless of which chart metric is selected.
    const selectedDayStr = days[days.length - 1];
    this.singleDayParcelsCount = collectedCountMap.get(selectedDayStr) || 0;
    this.singleDayParcelsList = parcels.filter(p => {
      if (p.parcelStatus !== 'COLLECTED') return false;
      const dateStr = (p.pickedAt || p.createdAt).split(/[ T]/)[0];
      return dateStr === selectedDayStr;
    });

    // FIX #6/#5/#14: use backend-provided authoritative aggregates instead
    // of recomputing from the (possibly truncated) fetched page. Falls back
    // to client-side computation only if the API response doesn't include
    // these fields, so the dashboard degrades gracefully rather than
    // breaking.
    const collected = parcels.filter(p => p.parcelStatus === 'COLLECTED').length;
    const total = apiResponse?.totalItems ?? parcels.length;
    const amount = apiResponse?.totalAmount ?? parcels.reduce((sum, p) => sum + (p.amount || 0), 0);
    const cash = apiResponse?.totalCash ?? parcels
      .filter(p => p.paymentMethod === 'CASH')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const cashless = apiResponse?.totalCashLess ?? parcels
      .filter(p => p.paymentMethod === 'CASHLESS')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    this.parcelStats = { total, collected, amount, cash, cashless };

    // Store the raw daily buckets so card clicks can re-render the chart
    // instantly without refetching or recomputing from scratch.
    this.parcelsDailyMetrics = {
      labels: days.map(day => {
        const date = this.parseLocalDay(day);
        return date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' });
      }),
      registered: days.map(day => registeredCountMap.get(day) || 0),
      collected: days.map(day => collectedCountMap.get(day) || 0),
      revenue: days.map(day => revenueMap.get(day) || 0),
      cash: days.map(day => cashMap.get(day) || 0),
      cashless: days.map(day => cashlessMap.get(day) || 0),
    };

    this.renderParcelsChart();
  }

  /**
   * Renders parcelsTrendData/parcelsTrendOptions from the currently
   * selected metric, using the precomputed daily buckets. Called whenever
   * a parcel-tab card is clicked, or whenever fresh data loads.
   */
  private renderParcelsChart(): void {
    if (!this.parcelsDailyMetrics) return;
    const m = this.parcelsDailyMetrics;

    const metricConfig: Record<typeof this.selectedParcelMetric, {
      title: string;
      datasets: any[];
      tooltipUnit: 'count' | 'currency';
    }> = {
      registered: {
        title: 'Parcel Registration Trend',
        tooltipUnit: 'count',
        datasets: [{
          label: 'Parcels Registered',
          data: m.registered,
          fill: true,
          borderColor: '#6f42c1',
          backgroundColor: 'rgba(111,66,193,0.1)',
          tension: 0.3,
          borderWidth: 2,
          pointBackgroundColor: '#6f42c1',
          pointHoverRadius: 6,
        }],
      },
      collected: {
        title: 'Parcel Collection Trend',
        tooltipUnit: 'count',
        datasets: [{
          label: 'Parcels Collected',
          data: m.collected,
          fill: true,
          borderColor: '#0dcaf0',
          backgroundColor: 'rgba(13,202,240,0.1)',
          tension: 0.3,
          borderWidth: 2,
          pointBackgroundColor: '#0dcaf0',
          pointHoverRadius: 6,
        }],
      },
      revenue: {
        title: 'Parcel Revenue Trend',
        tooltipUnit: 'currency',
        datasets: [{
          label: 'Revenue (KSh)',
          data: m.revenue,
          fill: true,
          borderColor: '#6c757d',
          backgroundColor: 'rgba(108,117,125,0.1)',
          tension: 0.3,
          borderWidth: 2,
          pointBackgroundColor: '#6c757d',
          pointHoverRadius: 6,
        }],
      },
      payment: {
        title: 'Payment Mode Trend',
        tooltipUnit: 'currency',
        datasets: [
          {
            label: 'Cash (KSh)',
            data: m.cash,
            fill: false,
            borderColor: '#198754',
            backgroundColor: '#198754',
            tension: 0.3,
            borderWidth: 2,
            pointBackgroundColor: '#198754',
            pointHoverRadius: 6,
          },
          {
            label: 'Cashless (KSh)',
            data: m.cashless,
            fill: false,
            borderColor: '#0d6efd',
            backgroundColor: '#0d6efd',
            tension: 0.3,
            borderWidth: 2,
            pointBackgroundColor: '#0d6efd',
            pointHoverRadius: 6,
          },
        ],
      },
    };

    const config = metricConfig[this.selectedParcelMetric];
    this.parcelsTrendTitle = config.title;

    this.parcelsTrendData = {
      labels: m.labels,
      datasets: config.datasets,
    };

    this.parcelsTrendOptions = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: config.datasets.length > 1, position: 'top' },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.parsed.y;
              const datasetLabel = context.dataset.label;
              return config.tooltipUnit === 'currency'
                ? `${datasetLabel}: KSh ${value.toLocaleString()}`
                : `${datasetLabel}: ${value}`;
            },
          },
        },
      },
      scales: {
        y: { beginAtZero: true },
      },
    };

    this.cdr.detectChanges();
  }

  /** Called from the parcel-tab card click handlers. */
  selectParcelMetric(metric: 'registered' | 'collected' | 'revenue' | 'payment'): void {
    if (this.selectedParcelMetric === metric) return;
    this.selectedParcelMetric = metric;
    this.renderParcelsChart();
  }

  // ── Driver Assignment Stats ────────────────────────────────────────────

  /**
   * Loads the total/active/inactive/pending/rejected assignment tallies.
   * Each call requests size:1 — we only need `totalRecords` from the
   * response, not the actual rows, so this stays cheap regardless of how
   * many assignments exist.
   */
  loadAssignmentStats(): void {
    if (!this.entityId) return;

    const tinyPage = { entityId: this.entityId, page: 0, size: 1 };

    forkJoin({
      total: this.dataService.post<DriverAssignmentApiResponse>(
        API_ENDPOINTS.ALL_DRIVER_ASSIGNMENTS,
        tinyPage,
        'assignment-stats-total'
      ),
      active: this.dataService.post<ActiveDriverAssignmentApiResponse>(
        API_ENDPOINTS.ALL_ACTIVE_DRIVERS,
        { ...tinyPage, status: 'ACTIVE' },
        'assignment-stats-active'
      ),
      inactive: this.dataService.post<ActiveDriverAssignmentApiResponse>(
        API_ENDPOINTS.ALL_ACTIVE_DRIVERS,
        { ...tinyPage, status: 'INACTIVE' },
        'assignment-stats-inactive'
      ),
      pending: this.dataService.post<PendingDriverAssignmentApiResponse>(
        API_ENDPOINTS.ALL_PENDING_REQUESTS,
        { ...tinyPage, status: 'PENDING' },
        'assignment-stats-pending'
      ),
      rejected: this.dataService.post<RejectedDriverAssignmentApiResponse>(
        API_ENDPOINTS.ALL_PENDING_REQUESTS,
        { ...tinyPage, status: 'REJECTED' },
        'assignment-stats-rejected'
      ),
    }).subscribe({
      next: (res: any) => {
        this.assignmentStats = {
          total: res.total?.totalRecords ?? 0,
          active: res.active?.totalRecords ?? 0,
          inactive: res.inactive?.totalRecords ?? 0,
          pending: res.pending?.totalRecords ?? 0,
          rejected: res.rejected?.totalRecords ?? 0,
        };
        this.assignmentStatsLoaded = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load driver assignment stats', err);
        this.assignmentStatsLoaded = true; // stop showing a loading state even on failure
        this.cdr.detectChanges();
      },
    });
  }

  // ── Vehicle Search ──────────────────────────────────────────────────────

  /**
   * Fetches the full assignment list once (large page size) and caches it
   * (bypassCache: false) so subsequent searches reuse it instead of
   * re-fetching. This is intentionally lazy — it only runs the first time
   * a vehicle search is performed, not on dashboard load.
   */
  private ensureAssignmentsListLoaded() {
    if (this.assignmentsListLoaded) {
      return of(this.allDriverAssignments);
    }

    return this.dataService
      .post<DriverAssignmentApiResponse>(
        API_ENDPOINTS.ALL_DRIVER_ASSIGNMENTS,
        { entityId: this.entityId, page: 0, size: 5000 },
        'all-driver-assignments-full',
        false // bypassCache: false — allow this to be served from cache
      )
      .pipe(
        tap((response) => {
          this.allDriverAssignments = response.data || [];
          this.assignmentsListLoaded = true;
        }),
        map(() => this.allDriverAssignments)
      );
  }

  /**
   * Searches the already-loaded fleet (allVehicles has no date filter, so
   * it already represents the whole fleet regardless of the dashboard's
   * selected date range) by fleet number or registration number, then
   * looks up the matching driver assignment.
   *
   * Payments for the matched vehicle are intentionally NOT fetched here —
   * that needs a "transactions by fleet number + date range" endpoint that
   * doesn't exist yet. The result panel has a placeholder for it; wire it
   * up once that endpoint is available.
   */
  searchVehicle(): void {
    const term = this.vehicleSearchTerm.trim().toLowerCase();
    this.vehicleSearchAttempted = true;
    this.vehicleSearchResult = null;
    this.vehicleSearchAssignment = null;

    if (!term) {
      return;
    }

    const normalizedTerm = term.replace(/\s+/g, '');
    const vehicle = this.allVehicles.find(v =>
      v.fleetNumber?.toLowerCase() === term ||
      v.registrationNumber?.toLowerCase().replace(/\s+/g, '') === normalizedTerm
    ) || null;

    this.vehicleSearchResult = vehicle;
    if (!vehicle) return;

    this.vehicleSearchLoading = true;
    this.ensureAssignmentsListLoaded().subscribe({
      next: (assignments) => {
        const matches = assignments.filter(
          a => a.fleetNumber?.toLowerCase() === vehicle.fleetNumber?.toLowerCase()
        );
        // Prefer the current ACTIVE assignment; otherwise fall back to the
        // most recently created one so there's still something useful to show.
        this.vehicleSearchAssignment =
          matches.find(a => a.status === 'ACTIVE') ??
          matches.sort(
            (a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
          )[0] ??
          null;
        this.vehicleSearchLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load assignments for vehicle search', err);
        this.vehicleSearchLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  clearVehicleSearch(): void {
    this.vehicleSearchTerm = '';
    this.vehicleSearchAttempted = false;
    this.vehicleSearchResult = null;
    this.vehicleSearchAssignment = null;
  }

  setDateRange() {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    this.dateRange = [lastWeek, today];
  }

  onDateRangeChange() {
    const event = { first: 0, rows: this.rows };
    this.loadTransactions(event);
    this.loadDashboardData();
  }

  onRefresh() {
    const event = { first: this.first, rows: this.rows };
    this.loadTransactions(event);
    this.loadDashboardData();
  }

  exportData() {
    // TODO: Implement export functionality
    console.log('Exporting data...');
  }

  signOut() {
    this.authService.signOut();
  }
}
