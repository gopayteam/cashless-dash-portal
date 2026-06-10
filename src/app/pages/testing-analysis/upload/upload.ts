import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadResponse } from '../../../../@core/services/analysis-api.service';
// import { UploadResponse } from '../../services/analysis-api.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-page">
      <div class="upload-container">

        <div class="hero-text">
          <h1 class="hero-title">Transaction<br/>Intelligence</h1>
          <p class="hero-desc">
            Upload your M-Pesa fleet CSV to instantly surface anomalies,
            analyse payment trends, and detect potential fraud.
          </p>
        </div>

        <div
          class="drop-zone"
          [class.drag-active]="dragging()"
          [class.loading]="loading"
          (dragover)="onDragOver($event)"
          (dragleave)="dragging.set(false)"
          (drop)="onDrop($event)"
          (click)="!loading && fileInput.click()"
        >
          <input #fileInput type="file" accept=".csv" style="display:none" (change)="onFileChange($event)" />

          <div class="dz-inner" *ngIf="!loading">
            <div class="dz-icon">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect x="4" y="6" width="22" height="28" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M26 6L32 12V34H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M18 16V26M18 16L14 20M18 16L22 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="dz-title">Drop your CSV here</p>
            <p class="dz-sub">or <span class="dz-link">browse files</span> — .csv only</p>
          </div>

          <div class="dz-loading" *ngIf="loading">
            <div class="spinner"></div>
            <p>Analysing transactions…</p>
          </div>
        </div>

        <div class="upload-error" *ngIf="error">
          <span class="err-icon">!</span>
          <span>{{ error }}</span>
        </div>

        <div class="schema-block">
          <p class="schema-label">Expected CSV columns</p>
          <div class="schema-cols">
            <span *ngFor="let c of cols" class="schema-col">{{ c }}</span>
          </div>
        </div>

      </div>

      <!-- Decorative side rule -->
      <div class="side-rule"></div>
    </div>
  `,
  styles: [`
    .upload-page {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 32px;
    }

    .side-rule {
      position: absolute;
      left: 48px;
      top: 80px;
      bottom: 80px;
      width: 1px;
      background: linear-gradient(180deg, transparent, #c4b49a 20%, #c4b49a 80%, transparent);
      opacity: 0.5;
    }

    .upload-container {
      max-width: 560px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 32px;
      position: relative;
      z-index: 1;
    }

    .hero-text { text-align: center; }

    .hero-title {
      font-family: 'Playfair Display', serif;
      font-size: 52px;
      font-weight: 700;
      color: #1a1410;
      line-height: 1.1;
      margin-bottom: 16px;
      letter-spacing: -1px;
    }

    .hero-desc {
      font-size: 15px;
      color: #7a6a52;
      line-height: 1.6;
      max-width: 420px;
      margin: 0 auto;
    }

    .drop-zone {
      border: 1.5px dashed #c4b49a;
      border-radius: 8px;
      background: rgba(255, 252, 246, 0.6);
      padding: 48px 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .drop-zone:hover, .drop-zone.drag-active {
      background: rgba(193, 127, 58, 0.06);
      border-color: #c17f3a;
      border-style: solid;
    }

    .drop-zone.loading { cursor: default; }

    .dz-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: #a09070;
    }

    .dz-icon { color: #c4b49a; transition: color 0.2s; }
    .drop-zone:hover .dz-icon, .drag-active .dz-icon { color: #c17f3a; }

    .dz-title { font-size: 16px; color: #5a4a34; font-weight: 500; }
    .dz-sub { font-size: 13px; color: #a09070; }
    .dz-link { color: #c17f3a; text-decoration: underline; cursor: pointer; }

    .dz-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #7a6a52;
      font-size: 14px;
    }

    .spinner {
      width: 32px; height: 32px;
      border: 2px solid #e8dcc8;
      border-top-color: #c17f3a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .upload-error {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #fdf0ee;
      border: 1px solid #e8b4ad;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 13px;
      color: #8b2a22;
    }

    .err-icon {
      flex-shrink: 0;
      width: 18px; height: 18px;
      background: #c0392b;
      color: #fff;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 11px;
      font-weight: 700;
    }

    .schema-block {
      background: rgba(255, 252, 246, 0.5);
      border: 1px solid #e0d4bc;
      border-radius: 6px;
      padding: 16px;
    }

    .schema-label {
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #a09070;
      margin-bottom: 10px;
    }

    .schema-cols {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .schema-col {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      background: #ede8df;
      color: #5a4a34;
      padding: 3px 8px;
      border-radius: 3px;
      border: 1px solid #d4c9b0;
    }
  `],
})
export class UploadComponent {
  @Input() loading = false;
  @Input() error = '';
  @Output() fileSelected = new EventEmitter<File>();
  @Output() uploaded = new EventEmitter<UploadResponse>();

  dragging = signal(false);

  cols = [
    'M-Pesa Receipt', 'Customer Name', 'Fleet Number',
    'Transaction Type', 'Payment Status', 'Amount (KES)',
    'Trip ID', 'Pickup', 'Drop Off', 'Driver Username',
    'Created At', 'Updated At',
  ];

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragging.set(true); }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.fileSelected.emit(file);
  }

  onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.fileSelected.emit(file);
  }
}
