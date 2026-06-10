import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalysisApiService, FleetBreakdown, KpiSummary, TransactionPage } from '../../../../@core/services/analysis-api.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overview" *ngIf="!loading(); else spinner">

      <!-- KPI strip -->
      <section class="kpi-strip" *ngIf="kpi()">
        <div class="kpi-card kpi-primary">
          <p class="kpi-label">Total Volume</p>
          <p class="kpi-value">KES {{ kpi()!.total_volume | number:'1.0-0' }}</p>
          <p class="kpi-sub">{{ kpi()!.transaction_count | number }} transactions</p>
        </div>
        <div class="kpi-card">
          <p class="kpi-label">Average Amount</p>
          <p class="kpi-value">KES {{ kpi()!.average_amount | number:'1.0-0' }}</p>
          <p class="kpi-sub">per transaction</p>
        </div>
        <div class="kpi-card">
          <p class="kpi-label">Peak Transaction</p>
          <p class="kpi-value">KES {{ kpi()!.max_amount | number:'1.0-0' }}</p>
          <p class="kpi-sub">highest single payment</p>
        </div>
        <div class="kpi-card">
          <p class="kpi-label">Active Fleets</p>
          <p class="kpi-value">{{ kpi()!.unique_fleets }}</p>
          <p class="kpi-sub">{{ kpi()!.unique_drivers }} unique drivers</p>
        </div>
        <div class="kpi-card kpi-danger" *ngIf="kpi()!.flagged_count > 0">
          <p class="kpi-label">Flagged</p>
          <p class="kpi-value">{{ kpi()!.flagged_count }}</p>
          <p class="kpi-sub">require review</p>
        </div>
        <div class="kpi-card kpi-ok" *ngIf="kpi()!.flagged_count === 0">
          <p class="kpi-label">Anomalies</p>
          <p class="kpi-value">None</p>
          <p class="kpi-sub">dataset looks clean</p>
        </div>
      </section>

      <div class="two-col">
        <!-- Fleet breakdown -->
        <section class="panel" *ngIf="fleet().length > 0">
          <h2 class="panel-title">Fleet Breakdown</h2>
          <div class="fleet-list">
            <div class="fleet-row" *ngFor="let f of fleet()">
              <div class="fleet-meta">
                <span class="fleet-id">{{ f.fleet }}</span>
                <span class="fleet-count">{{ f.count }} txn</span>
              </div>
              <div class="fleet-bar-track">
                <div class="fleet-bar" [style.width.%]="f.pct"
                     [class.bar-warn]="f.flagged > 0"></div>
              </div>
              <div class="fleet-values">
                <span class="fleet-total">KES {{ f.total | number:'1.0-0' }}</span>
                <span class="fleet-flagged" *ngIf="f.flagged > 0">⚑ {{ f.flagged }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Payment status -->
        <section class="panel" *ngIf="kpi()">
          <h2 class="panel-title">Payment Status</h2>
          <div class="status-chart">
            <div class="status-donut">
              <svg viewBox="0 0 100 100" width="120" height="120">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#e8dcc8" stroke-width="12"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#c17f3a" stroke-width="12"
                  [attr.stroke-dasharray]="paidDash() + ' ' + totalDash()"
                  stroke-dashoffset="25"
                  stroke-linecap="round"
                  transform="rotate(-90 50 50)"/>
                <text x="50" y="46" text-anchor="middle" font-size="13" font-weight="700" fill="#1a1410"
                  font-family="DM Mono, monospace">{{ paidPct() }}%</text>
                <text x="50" y="59" text-anchor="middle" font-size="7" fill="#a09070"
                  font-family="DM Sans, sans-serif">PAID</text>
              </svg>
            </div>
            <div class="status-legend">
              <div class="sl-row">
                <span class="sl-dot sl-paid"></span>
                <span class="sl-label">Paid</span>
                <span class="sl-val">{{ kpi()!.paid_count | number }}</span>
              </div>
              <div class="sl-row">
                <span class="sl-dot sl-unpaid"></span>
                <span class="sl-label">Unpaid</span>
                <span class="sl-val">{{ kpi()!.unpaid_count | number }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Transaction table -->
      <section class="panel">
        <div class="panel-header">
          <h2 class="panel-title">All Transactions</h2>
          <div class="table-controls">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="flaggedOnly" (change)="loadTransactions()" />
              <span>Flagged only</span>
            </label>
            <div class="pagination" *ngIf="txPage()">
              <button class="pg-btn" [disabled]="currentPage() <= 1" (click)="changePage(-1)">←</button>
              <span class="pg-info">{{ currentPage() }} / {{ txPage()!.pages }}</span>
              <button class="pg-btn" [disabled]="currentPage() >= txPage()!.pages" (click)="changePage(1)">→</button>
            </div>
          </div>
        </div>
        <div class="table-scroll">
          <table class="data-table" *ngIf="txPage()">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Customer</th>
                <th>Fleet</th>
                <th>Type</th>
                <th>Status</th>
                <th>Amount (KES)</th>
                <th>Driver</th>
                <th>Created At</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of txPage()!.transactions"
                  [class.row-flagged]="t.anomalies.length > 0">
                <td class="mono">{{ t.receipt }}</td>
                <td>{{ t.customer_name }}</td>
                <td><span class="tag tag-fleet">{{ t.fleet_number }}</span></td>
                <td><span class="tag tag-credit" *ngIf="t.transaction_type === 'CREDIT'">CREDIT</span>
                    <span class="tag" *ngIf="t.transaction_type !== 'CREDIT'">{{ t.transaction_type }}</span></td>
                <td><span class="tag tag-paid" *ngIf="t.payment_status === 'PAID'">PAID</span>
                    <span class="tag tag-unpaid" *ngIf="t.payment_status !== 'PAID'">{{ t.payment_status }}</span></td>
                <td class="mono amount">{{ t.amount | number:'1.0-0' }}</td>
                <td class="mono small">{{ t.driver_username }}</td>
                <td class="mono small">{{ t.created_at | date:'dd MMM, HH:mm' }}</td>
                <td>
                  <span *ngFor="let a of t.anomalies"
                        class="flag-chip"
                        [class.chip-high]="a.severity === 'HIGH'"
                        [class.chip-med]="a.severity === 'MEDIUM'"
                        [title]="a.label">
                    {{ flagCode(a.type) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <ng-template #spinner>
      <div class="loading-state">
        <div class="spin-ring"></div>
        <p>Loading data…</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .overview { display: flex; flex-direction: column; gap: 28px; }

    /* ── KPI strip ── */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      background: #fff;
      border: 1px solid #e0d4bc;
      border-radius: 8px;
      padding: 20px 22px;
      transition: box-shadow 0.15s;
    }

    .kpi-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }

    .kpi-primary { border-left: 3px solid #c17f3a; }
    .kpi-danger { border-left: 3px solid #c0392b; background: #fdfaf9; }
    .kpi-ok { border-left: 3px solid #2e7d52; }

    .kpi-label {
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #a09070;
      margin-bottom: 8px;
    }

    .kpi-value {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 700;
      color: #1a1410;
      margin-bottom: 4px;
    }

    .kpi-danger .kpi-value { color: #c0392b; }
    .kpi-ok .kpi-value { color: #2e7d52; }

    .kpi-sub { font-size: 11px; color: #b0a088; }

    /* ── Two-col ── */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 20px;
    }

    /* ── Panel ── */
    .panel {
      background: #fff;
      border: 1px solid #e0d4bc;
      border-radius: 8px;
      padding: 24px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .panel-title {
      font-family: 'Playfair Display', serif;
      font-size: 16px;
      font-weight: 600;
      color: #1a1410;
      margin-bottom: 18px;
    }

    .panel-header .panel-title { margin-bottom: 0; }

    /* ── Fleet bars ── */
    .fleet-list { display: flex; flex-direction: column; gap: 12px; }

    .fleet-row { display: flex; flex-direction: column; gap: 5px; }

    .fleet-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .fleet-id {
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      color: #1a1410;
      font-weight: 500;
    }

    .fleet-count { font-size: 11px; color: #a09070; }

    .fleet-bar-track {
      height: 6px;
      background: #f0e8d8;
      border-radius: 3px;
      overflow: hidden;
    }

    .fleet-bar {
      height: 100%;
      background: #c17f3a;
      border-radius: 3px;
      transition: width 0.6s ease;
    }

    .fleet-bar.bar-warn { background: #c0392b; }

    .fleet-values {
      display: flex;
      justify-content: space-between;
    }

    .fleet-total { font-size: 11px; color: #5a4a34; font-family: 'DM Mono', monospace; }
    .fleet-flagged { font-size: 11px; color: #c0392b; }

    /* ── Status donut ── */
    .status-chart {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-top: 8px;
    }

    .status-legend { display: flex; flex-direction: column; gap: 12px; }

    .sl-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }

    .sl-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
    }

    .sl-paid { background: #c17f3a; }
    .sl-unpaid { background: #e8dcc8; }
    .sl-label { color: #7a6a52; flex: 1; }
    .sl-val { font-family: 'DM Mono', monospace; font-size: 12px; color: #1a1410; font-weight: 500; }

    /* ── Table controls ── */
    .table-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #7a6a52;
      cursor: pointer;
    }

    .toggle-label input { accent-color: #c17f3a; }

    .pagination {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pg-btn {
      width: 28px; height: 28px;
      background: transparent;
      border: 1px solid #d4c9b0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      color: #7a6a52;
      transition: all 0.15s;
    }

    .pg-btn:hover:not(:disabled) { background: #f0e8d8; }
    .pg-btn:disabled { opacity: 0.3; cursor: default; }

    .pg-info {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      color: #a09070;
    }

    /* ── Data table ── */
    .table-scroll { overflow-x: auto; }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .data-table th {
      text-align: left;
      padding: 8px 12px;
      font-size: 9px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #a09070;
      border-bottom: 1px solid #e8dcc8;
      white-space: nowrap;
      font-weight: 500;
    }

    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f0eae0;
      color: #5a4a34;
      white-space: nowrap;
    }

    .data-table tr:hover td { background: #fdf9f4; }
    .data-table tr.row-flagged td { background: #fdf5f4; }
    .data-table tr.row-flagged:hover td { background: #faeae8; }

    .mono { font-family: 'DM Mono', monospace; }
    .small { font-size: 11px; }
    .amount { color: #1a1410; font-weight: 500; }

    .tag {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 500;
      background: #f0e8d8;
      color: #7a6a52;
      border: 1px solid #e0d4bc;
    }

    .tag-fleet { background: #eef4fa; color: #2c5282; border-color: #c3d9ef; }
    .tag-credit { background: #eefaf4; color: #1a5c38; border-color: #b3dfc9; }
    .tag-paid { background: #eefaf4; color: #1a5c38; border-color: #b3dfc9; }
    .tag-unpaid { background: #fdf5f4; color: #8b2a22; border-color: #e8b4ad; }

    .flag-chip {
      display: inline-block;
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-right: 3px;
      font-family: 'DM Mono', monospace;
    }

    .chip-high { background: #fdf0ee; color: #c0392b; border: 1px solid #e8b4ad; }
    .chip-med { background: #fdf8ee; color: #9a6a1a; border: 1px solid #e8d4a0; }

    /* ── Loading ── */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      min-height: 300px;
      color: #a09070;
      font-size: 14px;
    }

    .spin-ring {
      width: 36px; height: 36px;
      border: 2px solid #e8dcc8;
      border-top-color: #c17f3a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class OverviewComponent implements OnInit {
  kpi = signal<KpiSummary | null>(null);
  fleet = signal<FleetBreakdown[]>([]);
  txPage = signal<TransactionPage | null>(null);
  loading = signal(true);
  currentPage = signal(1);
  flaggedOnly = false;

  constructor(private api: AnalysisApiService) { }

  ngOnInit() {
    Promise.all([
      this.api.getKpi().toPromise().catch(() => null),
      this.api.getFleet().toPromise().catch(() => []),
    ]).then(([kpi, fleet]) => {
      this.kpi.set(kpi ?? null);
      this.fleet.set(fleet || []);
      this.loading.set(false);
    });
    this.loadTransactions();
  }

  loadTransactions() {
    this.api.getTransactions(this.currentPage(), 50, undefined, this.flaggedOnly)
      .subscribe({
        next: p => this.txPage.set(p),
        error: () => {
          this.txPage.set(null);
          this.loading.set(false);
        }
      });
  }

  changePage(dir: number) {
    this.currentPage.update(p => p + dir);
    this.loadTransactions();
  }

  paidPct() {
    const k = this.kpi();
    if (!k || k.transaction_count === 0) return 0;
    return Math.round((k.paid_count / k.transaction_count) * 100);
  }

  paidDash() {
    return ((this.paidPct() / 100) * (2 * Math.PI * 38)).toFixed(1);
  }

  totalDash() {
    return (2 * Math.PI * 38).toFixed(1);
  }

  flagCode(type: string): string {
    const map: Record<string, string> = {
      DUPLICATE_RECEIPT: 'DUP',
      UNUSUAL_AMOUNT: 'AMT',
      RAPID_DRIVER_REPEAT: 'RPD',
      OUTSIDE_BUSINESS_HOURS: 'OBH',
    };
    return map[type] ?? type;
  }
}
