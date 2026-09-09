// pages/parcels/stage-performance/stage-performance.component.ts
//
// NOTE ON IMPORT PATHS: this file assumes it lives one folder deeper than
// parcels.component.ts (pages/parcels/stage-performance/ vs pages/parcels/),
// so paths to @core go up one extra level (../../../../../@core/... instead
// of ../../../../@core/...). Adjust the relative paths below to match
// wherever you actually place this file.
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import * as XLSX from 'xlsx';
import { Stage } from '../../../../@core/models/locations/stage.model';
import { StagePerformance } from '../../../../@core/models/parcels/stage-performance.model';
import { StagePerformanceService } from '../../../../@core/services/stage-performance.service';
import { formatDateLocal } from '../../../../@core/utils/date-time.util';

type StageOption = { label: string; value: number | 'ALL' };

type StageTotals = Pick<
  StagePerformance,
  'parcelsProcessed' | 'totalAmount' | 'cashAmount' | 'cashlessAmount' | 'totalExpenses' | 'netRevenue'
>;

@Component({
  standalone: true,
  selector: 'app-stage-performance',
  templateUrl: './stage-performance.html',
  styleUrls: ['./stage-performance.css'],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    TableModule,
    SelectModule,
    ProgressSpinnerModule,
    TooltipModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
  ],
})
export class StagePerformanceComponent {
  /** Entity the report should be generated for. */
  @Input() entityId: string | null = null;

  /** Available source stages to report on (typically parcels.sourceStages). */
  @Input() stages: Stage[] = [];

  /** Dialog visibility — two-way bindable: [(visible)]="flag" */
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  dateRange: Date[] = [];
  selectedStageId: number | 'ALL' = 'ALL';

  rows: StagePerformance[] = [];
  hasGenerated = false;
  isLoading = false;
  isExporting = false;

  constructor(
    private stagePerformanceService: StagePerformanceService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {
    this.setDefaultDateRange();
  }

  get stageOptions(): StageOption[] {
    return [
      { label: 'All Stages', value: 'ALL' },
      ...this.stages.map(s => ({ label: s.name, value: s.id })),
    ];
  }

  get grandTotals(): StageTotals {
    return this.rows.reduce(
      (acc, row) => ({
        parcelsProcessed: acc.parcelsProcessed + row.parcelsProcessed,
        totalAmount: acc.totalAmount + row.totalAmount,
        cashAmount: acc.cashAmount + row.cashAmount,
        cashlessAmount: acc.cashlessAmount + row.cashlessAmount,
        totalExpenses: acc.totalExpenses + row.totalExpenses,
        netRevenue: acc.netRevenue + row.netRevenue,
      }),
      { parcelsProcessed: 0, totalAmount: 0, cashAmount: 0, cashlessAmount: 0, totalExpenses: 0, netRevenue: 0 }
    );
  }

  setDefaultDateRange(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    this.dateRange = [lastWeek, today];
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.rows = [];
    this.hasGenerated = false;
  }

  generateReport(): void {
    if (!this.entityId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Entity',
        detail: 'No entity is currently selected',
        life: 4000,
      });
      return;
    }

    const [start, end] = this.dateRange;
    if (!start || !end) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Date Range Required',
        detail: 'Please select a start and end date',
        life: 4000,
      });
      return;
    }

    this.isLoading = true;
    this.hasGenerated = false;

    const sourceId = this.selectedStageId === 'ALL' ? null : this.selectedStageId;

    this.stagePerformanceService
      .getStagePerformance(
        { entityId: this.entityId, startDate: start, endDate: end, sourceId },
        this.stages
      )
      .subscribe({
        next: (rows) => {
          this.rows = rows;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to generate stage performance report', err);
          this.cdr.detectChanges();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to generate stage performance report',
            life: 4000,
          });
        },
        complete: () => {
          this.isLoading = false;
          this.hasGenerated = true;
          this.cdr.detectChanges();
        },
      });
  }

  private buildExportRows(): Record<string, string | number>[] {
    return this.rows.map(row => ({
      'Stage': row.stageName,
      'Parcels Processed': row.parcelsProcessed,
      'Total Amount': row.totalAmount,
      'Cash Amount': row.cashAmount,
      'Cashless Amount': row.cashlessAmount,
      'Total Expenses': row.totalExpenses,
      'Net Revenue': row.netRevenue,
    }));
  }

  private buildFilename(extension: string): string {
    const [start, end] = this.dateRange;
    const startLabel = start ? formatDateLocal(start) : 'all';
    const endLabel = end ? formatDateLocal(end) : 'time';
    return `stage_performance_${startLabel}_to_${endLabel}.${extension}`;
  }

  exportToExcel(): void {
    if (this.rows.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'Generate a report before exporting',
        life: 3000,
      });
      return;
    }

    try {
      this.isExporting = true;

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.buildExportRows());
      ws['!cols'] = [
        { wch: 25 }, // Stage
        { wch: 18 }, // Parcels Processed
        { wch: 16 }, // Total Amount
        { wch: 16 }, // Cash Amount
        { wch: 16 }, // Cashless Amount
        { wch: 16 }, // Total Expenses
        { wch: 16 }, // Net Revenue
      ];

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stage Performance');
      XLSX.writeFile(wb, this.buildFilename('xlsx'));

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Stage performance exported to Excel successfully',
        life: 4000,
      });
    } catch (error) {
      console.error('Failed to export stage performance to Excel:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export stage performance to Excel',
        life: 4000,
      });
    } finally {
      this.isExporting = false;
    }
  }

  exportToCSV(): void {
    if (this.rows.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'Generate a report before exporting',
        life: 3000,
      });
      return;
    }

    try {
      this.isExporting = true;

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.buildExportRows());
      const csv = XLSX.utils.sheet_to_csv(ws);

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = this.buildFilename('csv');
      link.click();
      URL.revokeObjectURL(link.href);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Stage performance exported to CSV successfully',
        life: 4000,
      });
    } catch (error) {
      console.error('Failed to export stage performance to CSV:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export stage performance to CSV',
        life: 4000,
      });
    } finally {
      this.isExporting = false;
    }
  }
}
