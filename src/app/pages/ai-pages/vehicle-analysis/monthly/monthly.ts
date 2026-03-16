// components/vehicle-analysis/tabs/month-analysis-tab/month-analysis-tab.component.ts
import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { VehicleAnalysisResponse } from '../../../../../@core/models/eda/vehicle-analysis.model';
import { VehicleAnalysisPanelComponent } from '../../../../components/vehicle-analysis/vehicle-analysis-panel/vehicle-analysis-panel';

export interface MonthRange { year: number; month: number; }

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
  selector: 'app-month-analysis-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ButtonModule,
    MatFormFieldModule, MatSelectModule, MatNativeDateModule,
    VehicleAnalysisPanelComponent,
  ],
  templateUrl: './monthly.html',
  styleUrl: './monthly.css',
})
export class MonthlyAnalysisComponent {
  @Input() result: VehicleAnalysisResponse | null = null;
  @Input() loading = false;
  @Input() canAnalyse = false;

  @Output() analyse = new EventEmitter<MonthRange>();

  months = MONTHS;
  years: YearOption[] = this._buildYears();

  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();

  run(): void {
    this.analyse.emit({ year: this.selectedYear, month: this.selectedMonth });
  }

  private _buildYears(): YearOption[] {
    const now = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({ label: String(now - i), value: now - i }));
  }
}
