// components/vehicle-analysis/vehicle-analysis-modal/vehicle-analysis-modal.component.ts
import {
  Component, Input, OnChanges, SimpleChanges, OnDestroy,
  ChangeDetectorRef, ChangeDetectionStrategy, Output, EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';

import { VehicleAnalysisService } from '../../../../@core/services/vehicle-analysis.service';
import {
  VehicleAnalysisResponse,
  ANALYSIS_TABS,
  PeriodType,
} from '../../../../@core/models/eda/vehicle-analysis.model';
import { VehicleAnalysisPanelComponent } from '../vehicle-analysis-panel/vehicle-analysis-panel';
import { Vehicle } from '../../../../@core/models/vehicle/vehicle.model';

interface MonthOption { label: string; value: number; }
interface YearOption { label: string; value: number; }

const MONTHS: MonthOption[] = [
  { label: 'January', value: 1 }, { label: 'February', value: 2 },
  { label: 'March', value: 3 }, { label: 'April', value: 4 },
  { label: 'May', value: 5 }, { label: 'June', value: 6 },
  { label: 'July', value: 7 }, { label: 'August', value: 8 },
  { label: 'September', value: 9 }, { label: 'October', value: 10 },
  { label: 'November', value: 11 }, { label: 'December', value: 12 },
];

@Component({
  standalone: true,
  selector: 'app-vehicle-analysis-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
  imports: [
    CommonModule, FormsModule,
    DialogModule, TabsModule, ButtonModule, ToastModule, ProgressSpinnerModule,
    MatDatepickerModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatNativeDateModule,
    VehicleAnalysisPanelComponent,
  ],
  templateUrl: './vehicle-analysis-modal.html',
  styleUrls: ['./vehicle-analysis-modal.css', '../../../../styles/global/_toast.css'],
})
export class VehicleAnalysisModalComponent implements OnChanges, OnDestroy {
  /** The vehicle to analyse. Setting this triggers a reset. */
  @Input() vehicle: Vehicle | null = null;
  /** Entity ID of the logged-in user. */
  @Input() entityId: string = '';
  /** Controls modal visibility (two-way via (visibleChange) in parent). */
  @Input() visible = false;

  @Output() visibleChange = new EventEmitter<boolean>();

  // Tab state
  activeTabValue: PeriodType = 'day';
  tabs = ANALYSIS_TABS;

  // Per-tab date inputs
  dayDate: Date = new Date();
  weekDate: Date = new Date();

  // Default: End is today, Start is 6 days ago (Total 7 days)
  weekEndDate: Date = new Date();
  weekStartDate: Date = this._addDays(new Date(), -6);

  monthYear: number = new Date().getFullYear();
  monthMonth: number = new Date().getMonth() + 1;
  yearYear: number = new Date().getFullYear();

  months = MONTHS;
  years: YearOption[] = this._buildYears();

  // Results cache — keyed by PeriodType so switching tabs preserves results
  // results: Partial<Record<PeriodType, VehicleAnalysisResponse | null>> = {
  //   day: null, week: null, month: null, year: null,
  // };

  results: Record<PeriodType, VehicleAnalysisResponse | null> = {
    day: null, week: null, month: null, year: null,
    custom: null
  };

  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private analysisService: VehicleAnalysisService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicle'] && this.vehicle) {
      this.results = { day: null, week: null, month: null, year: null, custom: null };
      this.activeTabValue = 'day';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────
  // Tab handling
  // ─────────────────────────────────────────────

  onTabChange(value: any): void {
    this.activeTabValue = value as PeriodType;
  }

  onWeekStartChange(): void {
    if (this.weekStartDate) {
      // When user picks a start date, the end date is always +6 days
      this.weekEndDate = this._addDays(new Date(this.weekStartDate), 6);

      // Also update weekDate if your service uses it as the anchor
      this.weekDate = new Date(this.weekStartDate);

      this.cdr.markForCheck();
    }
  }

  // ─────────────────────────────────────────────
  // Run analysis for a given period
  // ─────────────────────────────────────────────

  runAnalysis(periodType: PeriodType): void {
    if (!this.vehicle || !this.entityId) return;

    this.loading = true;
    this.activeTabValue = periodType;
    this.cdr.markForCheck();

    const fleet = this.vehicle.fleetNumber;
    const entityId = this.entityId;

    let obs$: ReturnType<typeof this.analysisService.analyseDay> | ReturnType<typeof this.analysisService.analyseWeek> | ReturnType<typeof this.analysisService.analyseMonth> | ReturnType<typeof this.analysisService.analyseYear>;



    switch (periodType) {
      case 'day':
        obs$ = this.analysisService.analyseDay(entityId, [fleet], this._fmt(this.dayDate));
        break;
      case 'week':
        obs$ = this.analysisService.analyseWeek(
          entityId, [fleet], this.analysisService.getWeekStart(this.weekDate),
        );
        break;
      case 'month':
        obs$ = this.analysisService.analyseMonth(entityId, [fleet], this.monthYear, this.monthMonth);
        break;
      case 'year':
        obs$ = this.analysisService.analyseYear(entityId, [fleet], this.yearYear);
        break;
      default:
        return;
    }

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.results = { ...this.results, [periodType]: result ?? null };

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error', summary: 'Analysis Failed',
          detail: err?.error?.detail ?? 'No data found for the selected period',
        });
        this.cdr.markForCheck();
      },
    });
  }
  // ─────────────────────────────────────────────
  // Dialog control
  // ─────────────────────────────────────────────

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onDialogHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  get weekRangeLabel(): string {
    if (!this.weekStartDate || !this.weekEndDate) return '';
    return `${this._fmt(this.weekStartDate)} → ${this._fmt(this.weekEndDate)}`;
  }

  private _fmt(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private _buildYears(): YearOption[] {
    const now = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({ label: String(now - i), value: now - i }));
  }

  private _addDays(d: Date, days: number): Date {
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    return result;
  }

  private _currentWeekMonday(): Date {
    const today = new Date();
    const day = today.getDay(); // 0 = Sun
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday;
  }

  private _buildYearOptions(): YearOption[] {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      label: String(current - i),
      value: current - i,
    }));
  }
}
