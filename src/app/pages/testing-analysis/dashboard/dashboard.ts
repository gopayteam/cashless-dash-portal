import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { AnalysisApiService, KpiSummary } from '../../../../@core/services/analysis-api.service';
import { AnomaliesComponent } from '../anomalies/anomalies';
import { OverviewComponent } from '../overview/overview';
import { TimeFilterComponent } from '../time-filter/time-filter';
import { TrendsComponent } from '../trends/trends';
import { UploadComponent } from '../upload/upload';

type Tab = 'upload' | 'overview' | 'trends' | 'anomalies' | 'time-filter';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, OverviewComponent, TrendsComponent, AnomaliesComponent, TimeFilterComponent, UploadComponent],
  template: `
    <div class="dashboard">

      <!-- Tab nav -->
      <nav class="tab-nav">
        <div class="tab-nav-inner">
          <button
            *ngFor="let tab of tabs"
            class="tab-btn"
            [class.active]="activeTab() === tab.id"
            (click)="activeTab.set(tab.id)"
          >
            <span class="tab-num">{{ tab.num }}</span>
            <span class="tab-label">{{ tab.label }}</span>
            <span class="tab-badge" *ngIf="tab.id === 'anomalies' && kpi()?.flagged_count">
              {{ kpi()!.flagged_count }}
            </span>
          </button>

          <div class="tab-rule"></div>
        </div>
      </nav>

      <!-- Panels -->
      <main class="tab-panel">
        <app-upload *ngIf="activeTab() === 'upload'"
          [loading]="uploading()"
          [error]="uploadError()"
          (fileSelected)="onFileSelected($event)" />
        <app-overview *ngIf="activeTab() === 'overview'" />
        <app-trends *ngIf="activeTab() === 'trends'" />
        <app-anomalies *ngIf="activeTab() === 'anomalies'" />
        <app-time-filter *ngIf="activeTab() === 'time-filter'" />
      </main>
    </div>
  `,
  styles: [`
    .dashboard { min-height: 100vh; display: flex; flex-direction: column; }

    .tab-nav {
      background: rgba(245, 240, 232, 0.95);
      border-bottom: 1px solid #d4c9b0;
      position: sticky;
      top: 0;
      z-index: 90;
    }

    .tab-nav-inner {
      max-width: 1400px;
      margin: 0 auto;
      margin-bottom: 30px;
      padding: 0 32px;
      display: flex;
      align-items: flex-end;
      gap: 0;
      position: relative;
    }

    .tab-rule {
      position: absolute;
      bottom: 0;
      left: 32px;
      right: 32px;
      height: 1px;
      background: #d4c9b0;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 20px 14px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      color: #a09070;
      transition: all 0.15s;
      position: relative;
      z-index: 1;
      margin-bottom: -1px;
      letter-spacing: 0.3px;
    }

    .tab-btn:hover { color: #5a4a34; }
    .tab-btn.active { color: #1a1410; border-bottom-color: #c17f3a; }

    .tab-num {
      font-family: 'Playfair Display', serif;
      font-size: 11px;
      color: inherit;
      opacity: 0.5;
    }

    .tab-btn.active .tab-num { opacity: 1; color: #c17f3a; }

    .tab-label { font-weight: 500; }

    .tab-badge {
      background: #c0392b;
      color: #fff;
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 10px;
      font-family: 'DM Mono', monospace;
    }

    .tab-panel {
      flex: 1;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      padding: 36px 32px;
    }
  `],
})
export class AnalysisDashboardComponent implements OnInit {
  activeTab = signal<Tab>('upload');
  kpi = signal<KpiSummary | null>(null);
  uploading = signal(false);
  uploadError = signal('');

  tabs = [
    { id: 'upload' as Tab, num: '00', label: 'Upload' },
    { id: 'overview' as Tab, num: '01', label: 'Overview' },
    { id: 'trends' as Tab, num: '02', label: 'Trends' },
    { id: 'anomalies' as Tab, num: '03', label: 'Anomalies' },
    { id: 'time-filter' as Tab, num: '04', label: 'Time Filter' },
  ];

  constructor(private api: AnalysisApiService) { }

  ngOnInit() {
    this.refreshKpi();
  }

  refreshKpi() {
    this.api.getKpi().subscribe({
      next: (k) => {
        this.kpi.set(k);
        if (k && k.transaction_count > 0 && this.activeTab() === 'upload') {
          this.activeTab.set('overview');
        }
      },
      error: () => { }
    });
  }

  onFileSelected(file: File) {
    this.uploading.set(true);
    this.uploadError.set('');
    this.api.upload(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.refreshKpi();
      },
      error: (err) => {
        this.uploading.set(false);
        this.uploadError.set(err.error?.detail || 'Failed to upload CSV');
      }
    });
  }
}
