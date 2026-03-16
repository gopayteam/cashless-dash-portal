// components/vehicle-analysis/tabs/week-analysis-tab/week-analysis-tab.component.ts
import {
  Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { VehicleAnalysisResponse } from '../../../../../@core/models/eda/vehicle-analysis.model';
import { VehicleAnalysisPanelComponent } from '../../../../components/vehicle-analysis/vehicle-analysis-panel/vehicle-analysis-panel';

export interface WeekRange {
  start: string; // yyyy-MM-dd
  end: string;   // yyyy-MM-dd
}

@Component({
  standalone: true,
  selector: 'app-week-analysis-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ButtonModule,
    MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule,
    VehicleAnalysisPanelComponent,
  ],
  templateUrl: './weekly.html',
  styleUrl: './weekly.css',
})
export class WeeklyAnalysisComponent implements OnInit {
  @Input() result: VehicleAnalysisResponse | null = null;
  @Input() loading = false;
  @Input() canAnalyse = false;

  /** Emits { start, end } both as yyyy-MM-dd, always 7 days apart */
  @Output() analyse = new EventEmitter<WeekRange>();

  startDate: Date = new Date();
  endDate: Date = new Date();

  endMin: Date = new Date();
  endMax: Date = new Date();

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this._initDates();
  }

  private _initDates(): void {
    // Default: current Mon → Sun
    const today = new Date();
    const day = today.getDay(); // 0=Sun
    const diffToMon = (day === 0 ? -6 : 1 - day);
    this.startDate = new Date(today);
    this.startDate.setDate(today.getDate() + diffToMon);
    this._syncEndFromStart();
  }

  onStartChange(): void {
    this._syncEndFromStart();
    this.cdr.markForCheck();
  }

  private _syncEndFromStart(): void {
    const end = new Date(this.startDate);
    end.setDate(end.getDate() + 6);
    this.endDate = end;
    // Lock end range to exactly startDate+6
    this.endMin = end;
    this.endMax = end;
  }

  get rangeLabel(): string {
    return `${this._fmt(this.startDate)} → ${this._fmt(this.endDate)}`;
  }

  run(): void {
    this.analyse.emit({
      start: this._fmt(this.startDate),
      end: this._fmt(this.endDate),
    });
  }

  private _fmt(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
