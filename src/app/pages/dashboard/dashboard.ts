// pages/dashboard/dashboard.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { A11yModule } from '@angular/cdk/a11y';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DataService } from '../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../@core/api/endpoints';
import {
  DashboardDataModel,
  DashboardTransactionModel,
} from '../../../@fake-db/dashboard/dashboard.models';
import {
  buildLineChart,
  buildLineChartOptions,
  buildPieChart,
  buildPieChartOptions,
  mapStatsToCards,
} from '../../../@core/mappers/dashboard.mapper';
import { LoadingStore } from '../../../@core/state/loading.store';

interface StatsCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  change?: string;
}

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
  recentTransactions: DashboardTransactionModel[] = [];

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

  loadDashboardData(): void {
    this.loadingStore.start();

    this.dataService.get<DashboardDataModel>(API_ENDPOINTS.DASHBOARD).subscribe({
      next: (data) => {
        // Map stats to cards
        this.statsCards = mapStatsToCards(data.stats);

        // Build line chart
        this.chartData = buildLineChart(data.lineChart);
        this.chartOptions = buildLineChartOptions();

        // Build pie chart
        this.pieChartData = buildPieChart(data.pieChart);
        this.pieChartOptions = buildPieChartOptions();

        // Set transactions
        this.recentTransactions = data.recentTransactions;

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loadingStore.stop();
      },
      complete: () => {
        this.loadingStore.stop();
      },
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
