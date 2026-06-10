import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisApiService, TrendPoint } from '../../../../@core/services/analysis-api.service';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

@Component({
  selector: 'app-trends',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trends">

      <!-- Period selector -->
      <div class="period-bar">
        <button *ngFor="let p of periods"
          class="period-btn"
          [class.active]="period() === p.id"
          (click)="setPeriod(p.id)">
          {{ p.label }}
        </button>
      </div>

      <!-- Chart panel -->
      <div class="chart-panel" *ngIf="data().length > 0; else empty">
        <div class="chart-header">
          <h2 class="chart-title">Transaction Volume</h2>
          <div class="chart-legend">
            <span class="leg-dot leg-volume"></span><span>Volume (KES)</span>
            <span class="leg-dot leg-flagged"></span><span>Flagged txns</span>
          </div>
        </div>

        <div class="bar-chart">
          <div class="chart-y-axis">
            <span *ngFor="let t of yTicks()">{{ t | number:'1.0-0' }}</span>
          </div>
          <div class="chart-bars">
            <div class="bar-col" *ngFor="let d of data()"
                 [style.--h]="barHeight(d.total) + '%'"
                 [style.--fh]="flaggedHeight(d) + '%'"
                 [title]="d.label + ': KES ' + (d.total | number) + ' · ' + d.count + ' txns'">
              <div class="bar-fill">
                <div class="bar-flagged-layer" *ngIf="d.flagged > 0"></div>
              </div>
              <div class="bar-hover-info">
                <span class="bhi-label">{{ d.label }}</span>
                <span class="bhi-val">KES {{ d.total | number:'1.0-0' }}</span>
                <span class="bhi-count">{{ d.count }} txn</span>
                <span class="bhi-avg">avg KES {{ d.avg | number:'1.0-0' }}</span>
                <span class="bhi-flag" *ngIf="d.flagged > 0">⚑ {{ d.flagged }} flagged</span>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-x-axis">
          <span *ngFor="let d of data()">{{ d.label }}</span>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="stats-grid" *ngIf="data().length > 0">
        <div class="stat-card" *ngFor="let d of data()">
          <p class="sc-label">{{ d.label }}</p>
          <p class="sc-total">KES {{ d.total | number:'1.0-0' }}</p>
          <div class="sc-meta">
            <span>{{ d.count }} txn</span>
            <span *ngIf="d.flagged > 0" class="sc-flagged">⚑ {{ d.flagged }}</span>
          </div>
        </div>
      </div>

      <ng-template #empty>
        <div class="empty-state">
          <p>No trend data available.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .trends { display: flex; flex-direction: column; gap: 24px; }

    .period-bar {
      display: flex;
      gap: 4px;
      background: #fff;
      border: 1px solid #e0d4bc;
      border-radius: 8px;
      padding: 6px;
      width: fit-content;
    }

    .period-btn {
      padding: 8px 20px;
      background: transparent;
      border: none;
      border-radius: 5px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      color: #a09070;
      cursor: pointer;
      transition: all 0.15s;
      letter-spacing: 0.3px;
    }

    .period-btn:hover { color: #5a4a34; background: #f5f0e8; }
    .period-btn.active { background: #c17f3a; color: #fff; font-weight: 500; }

    .chart-panel {
      background: #fff;
      border: 1px solid #e0d4bc;
      border-radius: 8px;
      padding: 28px;
    }

    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
    }

    .chart-title {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 600;
      color: #1a1410;
    }

    .chart-legend {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: #a09070;
    }

    .leg-dot {
      display: inline-block;
      width: 10px; height: 10px;
      border-radius: 2px;
    }

    .leg-volume { background: #c17f3a; }
    .leg-flagged { background: rgba(192,57,43,0.3); }

    .bar-chart {
      display: flex;
      align-items: stretch;
      height: 220px;
      gap: 8px;
    }

    .chart-y-axis {
      display: flex;
      flex-direction: column-reverse;
      justify-content: space-between;
      padding-bottom: 4px;
      min-width: 70px;
    }

    .chart-y-axis span {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      color: #c4b49a;
      text-align: right;
    }

    .chart-bars {
      flex: 1;
      display: flex;
      align-items: flex-end;
      gap: 8px;
    }

    .bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
      position: relative;
      cursor: default;
    }

    .bar-col:hover .bar-hover-info { opacity: 1; pointer-events: auto; }

    .bar-fill {
      width: 100%;
      height: var(--h);
      background: #c17f3a;
      border-radius: 3px 3px 0 0;
      min-height: 3px;
      transition: height 0.5s ease;
      position: relative;
      overflow: hidden;
    }

    .bar-flagged-layer {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: var(--fh);
      background: rgba(192, 57, 43, 0.35);
    }

    .bar-hover-info {
      position: absolute;
      bottom: calc(var(--h) + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: #1a1410;
      color: #f5f0e8;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 11px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .bhi-label { font-weight: 600; color: #c17f3a; }
    .bhi-val { font-family: 'DM Mono', monospace; }
    .bhi-count, .bhi-avg { color: #c4b49a; }
    .bhi-flag { color: #e07060; }

    .chart-x-axis {
      display: flex;
      gap: 8px;
      padding-left: 78px;
      margin-top: 8px;
    }

    .chart-x-axis span {
      flex: 1;
      text-align: center;
      font-size: 10px;
      color: #c4b49a;
      font-family: 'DM Mono', monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Stats grid ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }

    .stat-card {
      background: #fff;
      border: 1px solid #e0d4bc;
      border-radius: 6px;
      padding: 14px 16px;
    }

    .sc-label {
      font-size: 10px;
      color: #a09070;
      font-family: 'DM Mono', monospace;
      margin-bottom: 6px;
    }

    .sc-total {
      font-family: 'Playfair Display', serif;
      font-size: 14px;
      font-weight: 600;
      color: #1a1410;
      margin-bottom: 4px;
    }

    .sc-meta {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #a09070;
    }

    .sc-flagged { color: #c0392b; }

    .empty-state {
      text-align: center;
      padding: 60px;
      color: #a09070;
      font-size: 14px;
      background: #fff;
      border: 1px solid #e0d4bc;
      border-radius: 8px;
    }
  `],
})
export class TrendsComponent implements OnInit {
  period = signal<Period>('daily');
  data = signal<TrendPoint[]>([]);

  periods = [
    { id: 'daily' as Period, label: 'Daily' },
    { id: 'weekly' as Period, label: 'Weekly' },
    { id: 'monthly' as Period, label: 'Monthly' },
    { id: 'yearly' as Period, label: 'Yearly' },
  ];

  constructor(private api: AnalysisApiService) {}

  ngOnInit() { this.load(); }

  setPeriod(p: Period) {
    this.period.set(p);
    this.load();
  }

  load() {
    this.api.getTrends(this.period()).subscribe({
      next: d => this.data.set(d),
      error: () => this.data.set([])
    });
  }

  maxVal() { return Math.max(...this.data().map(d => d.total), 1); }

  barHeight(val: number): number {
    return Math.round((val / this.maxVal()) * 100);
  }

  flaggedHeight(d: TrendPoint): number {
    if (d.total === 0) return 0;
    return Math.round((d.flagged / d.count) * 100);
  }

  yTicks(): number[] {
    const max = this.maxVal();
    return [max, max * 0.75, max * 0.5, max * 0.25, 0].map(v => Math.round(v));
  }
}
