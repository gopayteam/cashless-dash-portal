// pages/dashboard/dashboard.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { A11yModule } from '@angular/cdk/a11y';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';

import {
  buildLineChart,
  buildLineChartOptions,
  buildPieChart,
  buildPieChartOptions,
  mapStatsToCards,
  StatsCard,
} from '../../../../@core/mappers/dashboard.mapper';
import { LoadingStore } from '../../../../@core/state/loading.store';
import {
  DashboardData,
  TransactionStats,
  TransactionStatsByPeriod,
  TransactionStatsPerCategory,
} from '../../../../@core/models/dashboard/dashboard.models';
import { forkJoin, of } from 'rxjs';
import { PaymentRecord, PaymentRecordVM } from '../../../../@core/models/transactions/transactions.models';
import { PaymentsApiResponse } from '../../../../@core/models/transactions/payment_reponse.model';
import { formatDateLocal, formatRelativeTime } from '../../../../@core/utils/date-time.util';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { ThemeService } from '../../../../@core/services/theme.service';
import { ChatWidgetComponent } from "../../../components/chat-widget/chat-widget";
import { Vehicle } from '../../../../@core/models/vehicle/vehicle.model';
import { VehicleApiResponse } from '../../../../@core/models/vehicle/vehicle_reponse.model';
import { Parcel } from '../../../../@core/models/parcels/parcel.model';
import { ParcelsAPiResponse } from '../../../../@core/models/parcels/parcel_response.model';

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
  isSuperMetro: boolean = false;

  // Vehicles data & trends
  allVehicles: Vehicle[] = [];
  vehicleStats = { total: 0, active: 0, inactive: 0, capacity: 0 };
  vehiclesTrendData: any;
  vehiclesTrendOptions: any;
  singleDayVehiclesCount: number = 0;
  singleDayVehiclesList: Vehicle[] = [];

  // Parcels data & trends
  allParcels: Parcel[] = [];
  parcelStats = { total: 0, collected: 0, amount: 0, cash: 0, cashless: 0 };
  parcelsTrendData: any;
  parcelsTrendOptions: any;
  singleDayParcelsCount: number = 0;
  singleDayParcelsList: Parcel[] = [];

  singleDayLabel: string = '';

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
    this.isSuperMetro = this.entityId === 'GS000002' || this.entityId === 'GS0000002';
    this.themeService.applyTheme(user.entityId);
    this.themeService.loadPersistedTheme();

    this.setDateRange();

    // 🔥 FIRST LOAD
    const event = { first: 0, rows: this.rows };
    this.loadTransactions(event);
    this.loadDashboardData();

    // 🔁 RELOAD ON NAVIGATION
    // this.router.events.subscribe(() => {
    //   const event = { first: 0, rows: this.rows };
    //   this.loadTransactions(event);
    //   this.loadDashboardData();
    // });
  }



  loadTransactions($event: any): void {
    if (!this.dateRange || this.dateRange.length < 2) {
      return; // dates not ready yet
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
          const records = response.data.manifest;
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

    const isSuperMetro = this.isSuperMetro;

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
      vehicles: this.dataService.post<VehicleApiResponse>(
        API_ENDPOINTS.ALL_VEHICLES,
        { entityId: this.entityId, page: 0, size: 5000 },
        'vehicles'
      ),
      parcels: isSuperMetro
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
        this.buildVehiclesTrend(this.allVehicles, days);

        // Parcel details & trend processing
        if (isSuperMetro && data.parcels) {
          this.allParcels = data.parcels.parcels || [];
          this.buildParcelsTrend(this.allParcels, days);
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

  buildVehiclesTrend(vehicles: Vehicle[], days: string[]) {
    const countsMap = new Map<string, number>();
    days.forEach(day => countsMap.set(day, 0));

    vehicles.forEach(v => {
      if (v.createdOn) {
        const dateStr = v.createdOn.split('T')[0];
        if (countsMap.has(dateStr)) {
          countsMap.set(dateStr, countsMap.get(dateStr)! + 1);
        }
      }
    });

    const trendData = days.map(day => countsMap.get(day) || 0);

    const selectedDayStr = days[days.length - 1];
    this.singleDayVehiclesCount = countsMap.get(selectedDayStr) || 0;
    this.singleDayVehiclesList = vehicles.filter(v => v.createdOn && v.createdOn.startsWith(selectedDayStr));

    const active = vehicles.filter(v => v.status === 'ACTIVE').length;
    const inactive = vehicles.filter(v => v.status === 'INACTIVE' || v.status === 'BLOCKED').length;
    const total = vehicles.length;
    const capacity = vehicles.reduce((sum, v) => sum + (v.capacity || 0), 0);
    this.vehicleStats = { total, active, inactive, capacity };

    this.vehiclesTrendData = {
      labels: days.map(day => {
        const date = new Date(day);
        return date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' });
      }),
      datasets: [
        {
          label: 'Vehicles Activated',
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
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              return `Activated: ${context.parsed.y} vehicles`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    };
  }

  buildParcelsTrend(parcels: Parcel[], days: string[]) {
    const countsMap = new Map<string, number>();
    days.forEach(day => countsMap.set(day, 0));

    parcels.forEach(p => {
      if (p.parcelStatus === 'COLLECTED' || p.pickedAt) {
        const dateStr = p.pickedAt ? p.pickedAt.split('T')[0] : p.createdAt.split('T')[0];
        if (countsMap.has(dateStr)) {
          countsMap.set(dateStr, countsMap.get(dateStr)! + 1);
        }
      }
    });

    const trendData = days.map(day => countsMap.get(day) || 0);

    const selectedDayStr = days[days.length - 1];
    this.singleDayParcelsCount = countsMap.get(selectedDayStr) || 0;
    this.singleDayParcelsList = parcels.filter(p => {
      const isCollected = p.parcelStatus === 'COLLECTED' || p.pickedAt;
      const dateStr = p.pickedAt ? p.pickedAt.split('T')[0] : p.createdAt.split('T')[0];
      return isCollected && dateStr === selectedDayStr;
    });

    const total = parcels.length;
    const collected = parcels.filter(p => p.parcelStatus === 'COLLECTED').length;
    const amount = parcels.reduce((sum, p) => sum + (p.amount || 0), 0);
    const cash = parcels.filter(p => p.paymentMethod === 'CASH').reduce((sum, p) => sum + (p.amount || 0), 0);
    const cashless = parcels.filter(p => p.paymentMethod === 'CASHLESS').reduce((sum, p) => sum + (p.amount || 0), 0);
    this.parcelStats = { total, collected, amount, cash, cashless };

    this.parcelsTrendData = {
      labels: days.map(day => {
        const date = new Date(day);
        return date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' });
      }),
      datasets: [
        {
          label: 'Parcels Collected',
          data: trendData,
          fill: true,
          borderColor: '#0dcaf0',
          backgroundColor: 'rgba(13,202,240,0.1)',
          tension: 0.3,
          borderWidth: 2,
          pointBackgroundColor: '#0dcaf0',
          pointHoverRadius: 6
        }
      ]
    };

    this.parcelsTrendOptions = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              return `Collected: ${context.parsed.y} parcels`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    };
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

  // Sign out
  signOut() {
    this.authService.signOut(); // Auto redirects to signin
  }
}
