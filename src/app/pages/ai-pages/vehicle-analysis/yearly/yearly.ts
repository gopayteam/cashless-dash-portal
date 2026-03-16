// components/vehicle-analysis/tabs/year-analysis-tab/year-analysis-tab.component.ts
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

interface YearOption { label: string; value: number; }

@Component({
  standalone: true,
  selector: 'app-year-analysis-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ButtonModule,
    MatFormFieldModule, MatSelectModule, MatNativeDateModule,
    VehicleAnalysisPanelComponent,
  ],
  templateUrl: './yearly.html',
  styleUrl: './yearly.css',
})
export class YearlyAnalysisComponent {
  @Input() result: VehicleAnalysisResponse | null = null;
  @Input() loading = false;
  @Input() canAnalyse = false;

  @Output() analyse = new EventEmitter<number>();

  years: YearOption[] = this._buildYears();
  selectedYear: number = new Date().getFullYear();

  run(): void {
    this.analyse.emit(this.selectedYear);
  }

  private _buildYears(): YearOption[] {
    const now = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({ label: String(now - i), value: now - i }));
  }
}
