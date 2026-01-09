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
import { forkJoin } from 'rxjs';
import { PaymentRecord } from '../../../../@core/models/transactions/transactions.models';
import { PaymentsApiResponse } from '../../../../@core/models/transactions/payment_reponse.model';

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
  ],
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  statsCards: StatsCard[] = [];
  chartData: any;
  chartOptions: any;
  pieChartData: any;
  pieChartOptions: any;
  dateRange: Date[] = [];
  recentTransactions: PaymentRecord[] = [];
  // pagination state
  rows: number = 5;
  first: number = 0;
  totalRecords: number = 0;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private cdr: ChangeDetectorRef
  ) {}

  // Expose loading signal to template
  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    this.setDateRange();
    this.loadDashboardData();
  }

  loadTransactions($event: any): void {
    const [start, end] = this.dateRange;
    const event = $event;

    const page = event.first / event.rows;

    const payload = {
      entityId: 'GS000002',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
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
          this.recentTransactions = response.data.manifest;
          this.totalRecords = response.data.totalRecords;
          this.rows = event.rows;
          this.first = event.first;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Transaction load failed', err),
      });
  }

  loadDashboardData(): void {
    this.loadingStore.start();

    const [start, end] = this.dateRange;

    const baseParams = {
      entityId: 'GS000002',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
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
        'stats'
      ),
      transaction_stats_by_period: this.dataService.get<TransactionStatsByPeriod[]>(
        API_ENDPOINTS.STATS_BY_PERIOD,
        { ...baseParams, periodType: 'DAILY' },
        'daily'
      ),
      transaction_stats_per_category: this.dataService.get<TransactionStatsPerCategory[]>(
        API_ENDPOINTS.STATS_PER_CATEGORY,
        baseParams,
        'categories'
      ),

      recentTransactions: this.dataService.post<PaymentsApiResponse>(
        API_ENDPOINTS.ALL_PAYMENTS,
        transactionsPayload,
        'transactions'
      ),
    }).subscribe({
      next: (data: DashboardData) => {
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

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dashboard load failed', err);
        this.loadingStore.stop();
      },
      complete: () => this.loadingStore.stop(),
    });
  }

  setDateRange() {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    this.dateRange = [lastWeek, today];
  }

  onDateRangeChange() {
    // Reload dashboard data with new date range
    console.log('Date range changed:', this.dateRange);
    this.loadDashboardData();
  }

  exportData() {
    // TODO: Implement export functionality
    console.log('Exporting data...');
  }
}
