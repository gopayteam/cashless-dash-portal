import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisApiService, AnomalyReport, Transaction } from '../../../../@core/services/analysis-api.service';

type AnomalyType = 'DUPLICATE_RECEIPT' | 'UNUSUAL_AMOUNT' | 'RAPID_DRIVER_REPEAT' | 'OUTSIDE_BUSINESS_HOURS';
type ViewMode = 'all' | AnomalyType;

@Component({
  selector: 'app-anomalies',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="anomalies">

      <!-- Legend -->
      <div class="rule-legend">
        <div class="rule-card" *ngFor="let r of rules" [class.rule-active]="view() === r.type" (click)="setView(r.type)">
          <div class="rule-sev" [class]="'sev-' + r.severity.toLowerCase()">{{ r.severity }}</div>
          <div class="rule-code">{{ r.code }}</div>
          <div class="rule-desc">{{ r.desc }}</div>
          <div class="rule-count" *ngIf="report()">
            {{ report()!.by_type[r.type].length }}
          </div>
        </div>
      </div>

      <!-- View toggle -->
      <div class="view-bar" *ngIf="report() && report()!.total_flagged > 0">
        <button class="view-btn" [class.active]="view() === 'all'" (click)="setView('all')">
          All Flagged ({{ report()!.total_flagged }})
        </button>
        <ng-container *ngFor="let r of rules">
          <button *ngIf="report()!.by_type[r.type].length > 0"
            class="view-btn"
            [class.active]="view() === r.type"
            (click)="setView(r.type)">
            {{ r.code }} ({{ report()!.by_type[r.type].length }})
          </button>
        </ng-container>
      </div>

      <!-- Clean state -->
      <div class="clean-state" *ngIf="report() && report()!.total_flagged === 0">
        <div class="clean-icon">✓</div>
        <h3>No anomalies detected</h3>
        <p>All transactions in this dataset appear normal.</p>
      </div>

      <!-- Flagged cards -->
      <div class="flagged-list" *ngIf="visibleTxns().length > 0">
        <div class="flagged-card" *ngFor="let t of visibleTxns()">
          <div class="fc-header">
            <div class="fc-id">
              <span class="fc-receipt">{{ t.receipt }}</span>
              <span class="fc-name">{{ t.customer_name }}</span>
            </div>
            <div class="fc-right">
              <span class="fc-amount">KES {{ t.amount | number:'1.0-0' }}</span>
              <span class="fc-date">{{ t.created_at | date:'dd MMM yyyy, HH:mm' }}</span>
            </div>
          </div>

          <div class="fc-flags">
            <div class="fc-flag" *ngFor="let a of t.anomalies"
                 [class]="'fc-flag-' + a.severity.toLowerCase()">
              <span class="ff-sev">{{ a.severity }}</span>
              <span class="ff-msg">{{ a.label }}</span>
            </div>
          </div>

          <div class="fc-footer">
            <span class="fc-meta">Fleet: <strong>{{ t.fleet_number }}</strong></span>
            <span class="fc-meta">Driver: <strong class="mono">{{ t.driver_username }}</strong></span>
            <span class="fc-meta">Status:
              <strong [class.status-paid]="t.payment_status === 'PAID'"
                      [class.status-unpaid]="t.payment_status !== 'PAID'">
                {{ t.payment_status }}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="!report()">
        <div class="spin-ring"></div>
      </div>
    </div>
  `,
  styles: [`
    .anomalies { display: flex; flex-direction: column; gap: 24px; }

    /* ── Rule legend ── */
    .rule-legend {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .rule-card {
      background: #fff;
      border: 1px solid #e0d4bc;
      border-radius: 8px;
      padding: 16px 18px;
      cursor: pointer;
      transition: all 0.15s;
      position: relative;
    }

    .rule-card:hover { border-color: #c17f3a; }
    .rule-card.rule-active { border-color: #c17f3a; background: #fffaf4; }

    .rule-sev {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .sev-high { color: #c0392b; }
    .sev-medium { color: #9a6a1a; }
    .sev-low { color: #2c5282; }

    .rule-code {
      font-family: 'DM Mono', monospace;
      font-size: 18px;
      font-weight: 600;
      color: #1a1410;
      margin-bottom: 6px;
    }

    .rule-desc { font-size: 12px; color: #7a6a52; line-height: 1.4; }

    .rule-count {
      position: absolute;
      top: 14px;
      right: 16px;
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 700;
      color: #e0d4bc;
    }

    .rule-card.rule-active .rule-count { color: #c17f3a; opacity: 0.4; }

    /* ── View bar ── */
    .view-bar {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .view-btn {
      padding: 7px 14px;
      background: #fff;
      border: 1px solid #e0d4bc;
      border-radius: 4px;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      color: #7a6a52;
      cursor: pointer;
      transition: all 0.15s;
    }

    .view-btn:hover { border-color: #c17f3a; color: #5a3a1a; }
    .view-btn.active { background: #c17f3a; border-color: #c17f3a; color: #fff; }

    /* ── Clean state ── */
    .clean-state {
      text-align: center;
      padding: 60px;
      background: #fff;
      border: 1px solid #e0d4bc;
      border-radius: 8px;
    }

    .clean-icon {
      width: 56px; height: 56px;
      background: #eefaf4;
      border: 2px solid #b3dfc9;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 22px;
      color: #2e7d52;
      margin: 0 auto 16px;
    }

    .clean-state h3 {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      color: #1a1410;
      margin-bottom: 8px;
    }

    .clean-state p { font-size: 14px; color: #7a6a52; }

    /* ── Flagged cards ── */
    .flagged-list { display: flex; flex-direction: column; gap: 14px; }

    .flagged-card {
      background: #fff;
      border: 1px solid #e8c8c4;
      border-left: 4px solid #c0392b;
      border-radius: 8px;
      padding: 18px 20px;
    }

    .fc-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 14px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .fc-id { display: flex; flex-direction: column; gap: 3px; }

    .fc-receipt {
      font-family: 'DM Mono', monospace;
      font-size: 13px;
      color: #c0392b;
      font-weight: 500;
    }

    .fc-name { font-size: 14px; color: #1a1410; font-weight: 500; }

    .fc-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }

    .fc-amount {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 700;
      color: #c0392b;
    }

    .fc-date {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      color: #a09070;
    }

    .fc-flags { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }

    .fc-flag {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
    }

    .fc-flag-high { background: #fdf0ee; border-left: 3px solid #c0392b; }
    .fc-flag-medium { background: #fdf8ee; border-left: 3px solid #c17f3a; }
    .fc-flag-low { background: #eef4fa; border-left: 3px solid #3a7cc0; }

    .ff-sev {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      min-width: 52px;
    }

    .fc-flag-high .ff-sev { color: #c0392b; }
    .fc-flag-medium .ff-sev { color: #c17f3a; }
    .fc-flag-low .ff-sev { color: #3a7cc0; }

    .ff-msg { color: #5a4a34; line-height: 1.4; }

    .fc-footer {
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: #a09070;
      padding-top: 12px;
      border-top: 1px solid #f0e8d8;
      flex-wrap: wrap;
    }

    .fc-meta strong { color: #5a4a34; }
    .mono { font-family: 'DM Mono', monospace; }
    .status-paid { color: #2e7d52; }
    .status-unpaid { color: #c0392b; }

    /* ── Loading ── */
    .loading-state {
      display: grid;
      place-items: center;
      min-height: 200px;
    }

    .spin-ring {
      width: 32px; height: 32px;
      border: 2px solid #e8dcc8;
      border-top-color: #c17f3a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class AnomaliesComponent implements OnInit {
  report = signal<AnomalyReport | null>(null);
  view = signal<ViewMode>('all');

  rules = [
    { type: 'DUPLICATE_RECEIPT' as AnomalyType, code: 'DUP', desc: 'Duplicate M-Pesa receipt number', severity: 'HIGH' },
    { type: 'UNUSUAL_AMOUNT' as AnomalyType, code: 'AMT', desc: 'Amount > 3× dataset average', severity: 'HIGH' },
    { type: 'RAPID_DRIVER_REPEAT' as AnomalyType, code: 'RPD', desc: 'Same driver within 10 minutes', severity: 'MEDIUM' },
    { type: 'OUTSIDE_BUSINESS_HOURS' as AnomalyType, code: 'OBH', desc: 'Outside 06:00–22:00 window', severity: 'LOW' },
  ];

  visibleTxns = computed(() => {
    const r = this.report();
    if (!r) return [];
    if (this.view() === 'all') return r.all_flagged;
    return r.by_type[this.view()] ?? [];
  });

  constructor(private api: AnalysisApiService) {}

  ngOnInit() {
    this.api.getAnomalies().subscribe({
      next: r => this.report.set(r),
      error: () => this.report.set({
        total_flagged: 0,
        by_type: {
          DUPLICATE_RECEIPT: [],
          UNUSUAL_AMOUNT: [],
          RAPID_DRIVER_REPEAT: [],
          OUTSIDE_BUSINESS_HOURS: []
        },
        all_flagged: []
      } as any)
    });
  }

  setView(v: ViewMode) { this.view.set(v); }
}
