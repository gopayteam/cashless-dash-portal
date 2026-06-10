import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { AnalysisApiService, FilterResult } from '../../services/analysis-api.service';
import { AnalysisApiService, FilterResult } from '../../../../@core/services/analysis-api.service';

type FilterMode = 'hourly' | 'weekly' | 'monthly' | 'yearly';

@Component({
  selector: 'app-time-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="time-filter">

      <!-- Mode pills -->
      <div class="mode-row">
        <p class="mode-heading">Filter by</p>
        <div class="mode-pills">
          <button *ngFor="let m of modes"
            class="mode-pill"
            [class.active]="mode() === m.id"
            (click)="setMode(m.id)">
            {{ m.label }}
          </button>
        </div>
      </div>

      <!-- ── Hourly form ── -->
      <div class="filter-form" *ngIf="mode() === 'hourly'">
        <p class="form-hint">Show transactions within a specific date and hour window.</p>
        <div class="form-grid">
          <div class="form-field">
            <label>From Date</label>
            <input type="date" [(ngModel)]="fromDate" class="f-input" />
          </div>
          <div class="form-field">
            <label>From Hour</label>
            <select [(ngModel)]="fromHour" class="f-input">
              <option *ngFor="let h of hours" [value]="h.val">{{ h.label }}</option>
            </select>
          </div>
          <div class="form-field">
            <label>To Date</label>
            <input type="date" [(ngModel)]="toDate" class="f-input" />
          </div>
          <div class="form-field">
            <label>To Hour</label>
            <select [(ngModel)]="toHour" class="f-input">
              <option *ngFor="let h of hours" [value]="h.val">{{ h.label }}</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-apply" (click)="applyHourly()" [disabled]="loading()">
            {{ loading() ? 'Filtering…' : 'Apply Filter' }}
          </button>
          <button class="btn-clear" (click)="clear()">Clear</button>
        </div>
      </div>

      <!-- ── Weekly form ── -->
      <div class="filter-form" *ngIf="mode() === 'weekly'">
        <p class="form-hint">Pick any date — the full Mon–Sun week containing it will be filtered.</p>
        <div class="form-grid">
          <div class="form-field">
            <label>Any date in target week</label>
            <input type="date" [(ngModel)]="weekDate" class="f-input" (change)="computeWeekLabel()" />
          </div>
          <div class="form-field" *ngIf="weekLabel()">
            <label>Week window</label>
            <div class="week-range">{{ weekLabel() }}</div>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-apply" (click)="applyWeekly()" [disabled]="loading() || !weekDate">
            {{ loading() ? 'Filtering…' : 'Apply Filter' }}
          </button>
          <button class="btn-clear" (click)="clear()">Clear</button>
        </div>
      </div>

      <!-- ── Monthly form ── -->
      <div class="filter-form" *ngIf="mode() === 'monthly'">
        <p class="form-hint">Show all transactions for a full calendar month.</p>
        <div class="form-grid">
          <div class="form-field">
            <label>Year</label>
            <select [(ngModel)]="selectedYear" class="f-input">
              <option *ngFor="let y of availableYears()" [value]="y">{{ y }}</option>
            </select>
          </div>
          <div class="form-field">
            <label>Month</label>
            <select [(ngModel)]="selectedMonth" class="f-input">
              <option *ngFor="let m of monthNames; let i = index" [value]="i + 1">{{ m }}</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-apply" (click)="applyMonthly()" [disabled]="loading()">
            {{ loading() ? 'Filtering…' : 'Apply Filter' }}
          </button>
          <button class="btn-clear" (click)="clear()">Clear</button>
        </div>
      </div>

      <!-- ── Yearly form ── -->
      <div class="filter-form" *ngIf="mode() === 'yearly'">
        <p class="form-hint">Show all transactions for an entire calendar year.</p>
        <div class="form-grid">
          <div class="form-field">
            <label>Year</label>
            <select [(ngModel)]="selectedYear" class="f-input">
              <option *ngFor="let y of availableYears()" [value]="y">{{ y }}</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-apply" (click)="applyYearly()" [disabled]="loading()">
            {{ loading() ? 'Filtering…' : 'Apply Filter' }}
          </button>
          <button class="btn-clear" (click)="clear()">Clear</button>
        </div>
      </div>

      <!-- ── Results ── -->
      <div class="results" *ngIf="result()">
        <div class="result-header">
          <div class="result-window">
            <span class="rw-icon">◷</span>
            <span>{{ result()!.window_label }}</span>
          </div>
          <button class="btn-clear-sm" (click)="clear()">✕ Clear</button>
        </div>

        <!-- Mini KPIs -->
        <div class="result-kpis">
          <div class="rk-card">
            <p class="rk-label">Total Volume</p>
            <p class="rk-value">KES {{ result()!.total_volume | number:'1.0-0' }}</p>
          </div>
          <div class="rk-card">
            <p class="rk-label">Transactions</p>
            <p class="rk-value">{{ result()!.transaction_count | number }}</p>
          </div>
          <div class="rk-card">
            <p class="rk-label">Average</p>
            <p class="rk-value">KES {{ result()!.average_amount | number:'1.0-0' }}</p>
          </div>
          <div class="rk-card">
            <p class="rk-label">Peak</p>
            <p class="rk-value">KES {{ result()!.peak_amount | number:'1.0-0' }}</p>
          </div>
          <div class="rk-card">
            <p class="rk-label">Fleets</p>
            <p class="rk-value">{{ result()!.unique_fleets }}</p>
          </div>
          <div class="rk-card">
            <p class="rk-label">Drivers</p>
            <p class="rk-value">{{ result()!.unique_drivers }}</p>
          </div>
          <div class="rk-card rk-danger" *ngIf="result()!.flagged_count > 0">
            <p class="rk-label">Flagged</p>
            <p class="rk-value">{{ result()!.flagged_count }}</p>
          </div>
        </div>

        <!-- Table -->
        <div class="result-table-wrap">
          <div class="table-scroll">
            <table class="data-table" *ngIf="result()!.transactions.length > 0">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Customer</th>
                  <th>Fleet</th>
                  <th>Amount (KES)</th>
                  <th>Driver</th>
                  <th>Created At</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of result()!.transactions"
                    [class.row-flagged]="t.anomalies.length > 0">
                  <td class="mono">{{ t.receipt }}</td>
                  <td>{{ t.customer_name }}</td>
                  <td><span class="tag tag-fleet">{{ t.fleet_number }}</span></td>
                  <td class="mono amount">{{ t.amount | number:'1.0-0' }}</td>
                  <td class="mono small">{{ t.driver_username }}</td>
                  <td class="mono small">{{ t.created_at | date:'dd MMM yyyy, HH:mm' }}</td>
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
            <div class="no-results" *ngIf="result()!.transactions.length === 0">
              No transactions found in this window.
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .time-filter { display: flex; flex-direction: column; gap: 24px; }

    .mode-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }

    .mode-heading {
      font-size: 12px;
      color: #a09070;
      letter-spacing: 1px;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .mode-pills { display: flex; gap: 6px; flex-wrap: wrap; }

    .mode-pill {
      padding: 8px 18px;
      background: #fff;
      border: 1px solid #e0d4bc;
      border-radius: 24px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      color: #7a6a52;
      cursor: pointer;
      transition: all 0.15s;
    }

    .mode-pill:hover { border-color: #c17f3a; color: #5a3a1a; }
    .mode-pill.active { background: #c17f3a; border-color: #c17f3a; color: #fff; font-weight: 500; }

    /* ── Form ── */
    .filter-form {
      background: #fff;
      border: 1px solid #e0d4bc;
      border-radius: 8px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      max-width: 640px;
    }

    .form-hint { font-size: 13px; color: #a09070; font-style: italic; }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-field { display: flex; flex-direction: column; gap: 6px; }

    .form-field label {
      font-size: 10px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #a09070;
      font-weight: 500;
    }

    .f-input {
      background: #f5f0e8;
      border: 1px solid #d4c9b0;
      border-radius: 5px;
      color: #1a1410;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      padding: 9px 12px;
      outline: none;
      transition: border-color 0.15s;
    }

    .f-input:focus { border-color: #c17f3a; background: #fff; }
    .f-input option { background: #fff; }

    .week-range {
      background: #fffaf4;
      border: 1px solid #e0d4bc;
      border-radius: 5px;
      color: #c17f3a;
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      padding: 9px 12px;
    }

    .form-actions { display: flex; gap: 10px; }

    .btn-apply {
      padding: 10px 24px;
      background: #c17f3a;
      border: none;
      border-radius: 5px;
      color: #fff;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-apply:hover:not(:disabled) { background: #a0663a; }
    .btn-apply:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-clear {
      padding: 10px 16px;
      background: transparent;
      border: 1px solid #d4c9b0;
      border-radius: 5px;
      color: #a09070;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-clear:hover { border-color: #c0392b; color: #c0392b; }

    /* ── Results ── */
    .results { display: flex; flex-direction: column; gap: 16px; }

    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .result-window {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #1a1410;
      font-weight: 500;
    }

    .rw-icon { color: #c17f3a; font-size: 18px; }

    .btn-clear-sm {
      padding: 5px 12px;
      background: transparent;
      border: 1px solid #e0d4bc;
      border-radius: 4px;
      font-size: 11px;
      color: #a09070;
      cursor: pointer;
      font-family: 'DM Sans', sans-serif;
      transition: all 0.15s;
    }

    .btn-clear-sm:hover { border-color: #c0392b; color: #c0392b; }

    .result-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 10px;
    }

    .rk-card {
      background: #fff;
      border: 1px solid #e0d4bc;
      border-radius: 6px;
      padding: 14px 16px;
    }

    .rk-danger { border-color: #e8b4ad; background: #fdf9f8; }

    .rk-label {
      font-size: 9px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #a09070;
      margin-bottom: 6px;
    }

    .rk-value {
      font-family: 'Playfair Display', serif;
      font-size: 15px;
      font-weight: 700;
      color: #1a1410;
    }

    .rk-danger .rk-value { color: #c0392b; }

    .result-table-wrap {
      background: #fff;
      border: 1px solid #e0d4bc;
      border-radius: 8px;
      padding: 20px;
    }

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

    .mono { font-family: 'DM Mono', monospace; }
    .small { font-size: 11px; }
    .amount { color: #1a1410; font-weight: 500; }

    .tag {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 500;
    }

    .tag-fleet { background: #eef4fa; color: #2c5282; border: 1px solid #c3d9ef; }

    .flag-chip {
      display: inline-block;
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 700;
      margin-right: 3px;
      font-family: 'DM Mono', monospace;
    }

    .chip-high { background: #fdf0ee; color: #c0392b; border: 1px solid #e8b4ad; }
    .chip-med { background: #fdf8ee; color: #9a6a1a; border: 1px solid #e8d4a0; }

    .no-results {
      text-align: center;
      padding: 32px;
      color: #a09070;
      font-size: 14px;
    }
  `],
})
export class TimeFilterComponent implements OnInit {
  mode = signal<FilterMode>('hourly');
  result = signal<FilterResult | null>(null);
  loading = signal(false);
  availableYears = signal<number[]>([new Date().getFullYear()]);

  // Hourly
  fromDate = '';
  fromHour = 0;
  toDate = '';
  toHour = 23;

  // Weekly
  weekDate = '';
  weekLabel = signal('');

  // Monthly / Yearly
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;

  monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  modes = [
    { id: 'hourly' as FilterMode, label: '◷ Date & Hour' },
    { id: 'weekly' as FilterMode, label: '▦ Week' },
    { id: 'monthly' as FilterMode, label: '▤ Month' },
    { id: 'yearly' as FilterMode, label: '◫ Year' },
  ];

  hours = Array.from({ length: 24 }, (_, i) => ({
    val: i,
    label: `${i.toString().padStart(2,'0')}:00 ${i < 12 ? (i === 0 ? '(12 AM)' : `(${i} AM)`) : (i === 12 ? '(12 PM)' : `(${i-12} PM)`)}`,
  }));

  constructor(private api: AnalysisApiService) {}

  ngOnInit() {
    this.api.getAvailableYears().subscribe({
      next: r => {
        this.availableYears.set(r.years);
        if (r.years.length) this.selectedYear = r.years[r.years.length - 1];
      },
      error: () => this.availableYears.set([new Date().getFullYear()])
    });
  }

  setMode(m: FilterMode) { this.mode.set(m); this.clear(); }

  applyHourly() {
    if (!this.fromDate || !this.toDate) return;
    this.loading.set(true);
    this.api.filterHourly(this.fromDate, this.fromHour, this.toDate, this.toHour)
      .subscribe({
        next: r => { this.result.set(r); this.loading.set(false); },
        error: () => { this.result.set(null); this.loading.set(false); }
      });
  }

  computeWeekLabel() {
    if (!this.weekDate) { this.weekLabel.set(''); return; }
    const d = new Date(this.weekDate);
    const day = d.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(d); mon.setDate(d.getDate() + diffToMon);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const fmt = (dt: Date) => dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    this.weekLabel.set(`${fmt(mon)} – ${fmt(sun)}`);
  }

  applyWeekly() {
    if (!this.weekDate) return;
    this.loading.set(true);
    this.api.filterWeekly(this.weekDate)
      .subscribe({
        next: r => { this.result.set(r); this.loading.set(false); },
        error: () => { this.result.set(null); this.loading.set(false); }
      });
  }

  applyMonthly() {
    this.loading.set(true);
    this.api.filterMonthly(this.selectedYear, this.selectedMonth)
      .subscribe({
        next: r => { this.result.set(r); this.loading.set(false); },
        error: () => { this.result.set(null); this.loading.set(false); }
      });
  }

  applyYearly() {
    this.loading.set(true);
    this.api.filterYearly(this.selectedYear)
      .subscribe({
        next: r => { this.result.set(r); this.loading.set(false); },
        error: () => { this.result.set(null); this.loading.set(false); }
      });
  }

  clear() {
    this.result.set(null);
    this.weekLabel.set('');
    this.fromDate = '';
    this.toDate = '';
    this.weekDate = '';
  }

  flagCode(type: string): string {
    return { DUPLICATE_RECEIPT: 'DUP', UNUSUAL_AMOUNT: 'AMT', RAPID_DRIVER_REPEAT: 'RPD', OUTSIDE_BUSINESS_HOURS: 'OBH' }[type] ?? type;
  }
}
