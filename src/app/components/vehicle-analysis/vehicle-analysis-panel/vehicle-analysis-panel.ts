// components/vehicle-analysis/vehicle-analysis-panel/vehicle-analysis-panel.component.ts
import {
  Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { VehicleAnalysisResponse, FleetSummary } from '../../../../@core/models/eda/vehicle-analysis.model';
import { VehicleAnalysisService } from '../../../../@core/services/vehicle-analysis.service';

@Component({
  standalone: true,
  selector: 'app-vehicle-analysis-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ChartModule, CardModule, TagModule, SkeletonModule],
  template: `
<div class="analysis-panel">

  <!-- ── Loading skeleton ─────────────────── -->
  <ng-container *ngIf="loading">
    <div class="charts-grid">
      <p-card *ngFor="let i of [1,2,3]" styleClass="chart-card">
        <p-skeleton height="280px" />
      </p-card>
    </div>
  </ng-container>

  <!-- ── No data ──────────────────────────── -->
  <div *ngIf="!loading && !data" class="empty-panel">
    <i class="pi pi-chart-line empty-icon"></i>
    <p>Select fleet(s) and a date to run analysis</p>
  </div>

  <!-- ── Analysis results ─────────────────── -->
  <ng-container *ngIf="!loading && data">

    <!-- Summary header -->
    <div class="analysis-header">
      <div class="period-badge">
        <i class="pi pi-calendar-plus"></i>
        <span>{{ data.period }}</span>
      </div>
      <div class="source-badge" [class]="'source-' + data.dataSource">
        <i class="pi pi-database"></i>
        <span>Source: {{ data.dataSource }}</span>
      </div>
    </div>

    <!-- Fleet summary cards -->
    <div class="fleet-summary-grid">
      <div *ngFor="let s of data.fleetSummaries; let i = index"
           class="fleet-summary-card"
           [style.border-left-color]="fleetColor(i)">
        <div class="fleet-num">{{ s.fleetNumber }}</div>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Revenue</span>
            <span class="stat-val revenue">KES {{ s.totalRevenue | number:'1.0-0' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Trips</span>
            <span class="stat-val">{{ s.totalTrips }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Avg/Trip</span>
            <span class="stat-val">KES {{ s.averagePerTrip | number:'1.0-0' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Paid</span>
            <span class="stat-val paid">{{ s.paidTrips }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Pending</span>
            <span class="stat-val pending">{{ s.pendingTrips }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Failed</span>
            <span class="stat-val failed">{{ s.failedTrips }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts grid -->
    <div class="charts-grid">

      <!-- Earnings line chart -->
      <p-card styleClass="chart-card" header="Earnings Over Time">
        <div class="chart-wrapper">
          <p-chart
            type="line"
            [data]="data.earningsChart"
            [options]="lineOptions"
            height="280"
          />
        </div>
      </p-card>

      <!-- Trips bar chart -->
      <p-card styleClass="chart-card" header="Trips per Period">
        <div class="chart-wrapper">
          <p-chart
            type="bar"
            [data]="data.tripsChart"
            [options]="barOptions"
            height="280"
          />
        </div>
      </p-card>

      <!-- Payment status doughnut -->
      <p-card styleClass="chart-card" header="Payment Status Breakdown">
        <div class="chart-wrapper doughnut-wrapper">
          <p-chart
            type="doughnut"
            [data]="data.paymentStatusChart"
            [options]="doughnutOptions"
            height="280"
          />
        </div>
      </p-card>

      <!-- Scatter comparison (multi-fleet only) -->
      <p-card
        *ngIf="data.comparisonChart && data.fleetSummaries.length > 1"
        styleClass="chart-card chart-card--wide"
        header="Fleet Comparison (Revenue vs Trips)"
      >
        <div class="chart-wrapper">
          <p-chart
            type="bar"
            [data]="comparisonBarData"
            [options]="comparisonOptions"
            height="240"
          />
        </div>
      </p-card>

    </div>

    <!-- Global totals -->
    <div class="global-totals">
      <div class="total-chip">
        <i class="pi pi-money-bill"></i>
        <span>Total Revenue: <strong>KES {{ data.totalRevenue | number:'1.0-0' }}</strong></span>
      </div>
      <div class="total-chip">
        <i class="pi pi-sort-amount-up"></i>
        <span>Total Trips: <strong>{{ data.totalTrips }}</strong></span>
      </div>
    </div>

  </ng-container>
</div>
  `,
  styles: [`
    .analysis-panel { display: flex; flex-direction: column; gap: 1.5rem; }

    /* ── Header ──────────────────────────── */
    .analysis-header {
      display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
    }
    .period-badge, .source-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.35rem 0.8rem; border-radius: 999px; font-size: 0.85rem; font-weight: 600;
    }
    .period-badge { background: #667eea22; color: #667eea; }
    .source-payload { background: #43e97b22; color: #1a7a40; }
    .source-database { background: #4facfe22; color: #0066cc; }
    .source-api { background: #fa709a22; color: #a0004a; }
    .source-csv { background: #ffc10722; color: #7a5c00; }

    /* ── Fleet summary cards ─────────────── */
    .fleet-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }
    .fleet-summary-card {
      background: white; border-radius: 10px; padding: 1rem 1.25rem;
      border-left: 4px solid #667eea;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    }
    .fleet-num { font-size: 1rem; font-weight: 700; color: #2c3e50; margin-bottom: 0.75rem; }
    .summary-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
    .stat-item { display: flex; flex-direction: column; gap: 0.15rem; }
    .stat-label { font-size: 0.7rem; color: #8899aa; text-transform: uppercase; font-weight: 600; }
    .stat-val { font-size: 0.9rem; font-weight: 700; color: #2c3e50; }
    .stat-val.revenue { color: #667eea; }
    .stat-val.paid { color: #43e97b; }
    .stat-val.pending { color: #ffc107; }
    .stat-val.failed { color: #f5576c; }

    /* ── Charts ──────────────────────────── */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.25rem;
    }
    .chart-card--wide { grid-column: 1 / -1; }
    .chart-wrapper { height: 280px; }
    .doughnut-wrapper { display: flex; justify-content: center; }

    /* ── Totals strip ────────────────────── */
    .global-totals {
      display: flex; gap: 1rem; flex-wrap: wrap;
    }
    .total-chip {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: #f0f2ff; border-radius: 8px; padding: 0.6rem 1rem;
      font-size: 0.9rem; color: #2c3e50;
    }
    .total-chip i { color: #667eea; }

    /* ── Empty ───────────────────────────── */
    .empty-panel {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 1rem;
      padding: 4rem; color: #aab; font-size: 1rem;
    }
    .empty-icon { font-size: 3rem; color: #dde; }

    @media (max-width: 768px) {
      .charts-grid { grid-template-columns: 1fr; }
      .chart-card--wide { grid-column: 1; }
    }
  `],
})
export class VehicleAnalysisPanelComponent implements OnChanges {
  @Input() data: VehicleAnalysisResponse | null = null;
  @Input() loading = false;

  lineOptions: any;
  barOptions: any;
  doughnutOptions: any;
  comparisonOptions: any;
  comparisonBarData: any;

  private readonly FLEET_COLORS = [
    '#667eea', '#f5576c', '#4facfe', '#43e97b', '#fa709a',
  ];

  constructor(private analysisService: VehicleAnalysisService) {
    this.lineOptions = this.analysisService.getLineChartOptions();
    this.barOptions = this.analysisService.getBarChartOptions();
    this.doughnutOptions = this.analysisService.getDoughnutOptions();
    this.comparisonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Revenue (KES)' } } },
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this._buildComparisonBar();
    }
  }

  fleetColor(index: number): string {
    return this.FLEET_COLORS[index % this.FLEET_COLORS.length];
  }

  private _buildComparisonBar(): void {
    if (!this.data?.fleetSummaries) return;
    const summaries = this.data.fleetSummaries;
    this.comparisonBarData = {
      labels: summaries.map(s => s.fleetNumber),
      datasets: [
        {
          label: 'Total Revenue (KES)',
          data: summaries.map(s => s.totalRevenue),
          backgroundColor: summaries.map((_, i) => this.fleetColor(i) + 'bb'),
          borderColor: summaries.map((_, i) => this.fleetColor(i)),
          borderWidth: 2,
        },
        {
          label: 'Total Trips',
          data: summaries.map(s => s.totalTrips),
          backgroundColor: summaries.map((_, i) => this.fleetColor(i) + '44'),
          borderColor: summaries.map((_, i) => this.fleetColor(i)),
          borderWidth: 2,
          yAxisID: 'y2',
        },
      ],
    };
    this.comparisonOptions = {
      ...this.comparisonOptions,
      scales: {
        y: { beginAtZero: true, position: 'left', title: { display: true, text: 'Revenue (KES)' } },
        y2: { beginAtZero: true, position: 'right', title: { display: true, text: 'Trips' }, grid: { drawOnChartArea: false } },
      },
    };
  }
}
