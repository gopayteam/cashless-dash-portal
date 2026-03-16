// components/vehicle-analysis/tabs/day-analysis-tab/day-analysis-tab.component.ts
import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
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

@Component({
  standalone: true,
  selector: 'app-day-analysis-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ButtonModule,
    MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule,
    VehicleAnalysisPanelComponent,
  ],
  templateUrl: './daily.html',
  styleUrl: './daily.css',
})
export class DailyAnalysisComponent {
  @Input() result: VehicleAnalysisResponse | null = null;
  @Input() loading = false;
  @Input() canAnalyse = false;

  @Output() analyse = new EventEmitter<string>();

  date: Date = new Date();

  run(): void {
    this.analyse.emit(this.date.toISOString().split('T')[0]);
  }
}
