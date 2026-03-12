// pages/vehicle-analysis/vehicle-analysis.component.ts
import {
  Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';

import { Router } from '@angular/router';
import { AuthService } from '../../../@core/services/auth.service';
import { DataService } from '../../../@core/api/data.service';
import { VehicleAnalysisService } from '../../../@core/services/vehicle-analysis.service';
import { VehicleAnalysisResponse } from '../../../@core/models/eda/vehicle-analysis.model';
import { API_ENDPOINTS } from '../../../@core/api/endpoints';
import { VehicleAnalysisPanelComponent } from '../../components/vehicle-analysis/vehicle-analysis-panel/vehicle-analysis-panel';
import { Vehicle } from '../../../@core/models/vehicle/vehicle.model';
import { VehicleApiResponse } from '../../../@core/models/vehicle/vehicle_reponse.model';
import { VehicleTransactionTableComponent } from "../../components/transactions-table/transactions-table";

type PeriodTab = 'day' | 'week' | 'month' | 'year';

interface YearOption { label: string; value: number; }
interface MonthOption { label: string; value: number; }

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
  selector: 'app-vehicle-analysis',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, TabsModule, MultiSelectModule,
    ProgressSpinnerModule, ToastModule,
    MatDatepickerModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatNativeDateModule,
    VehicleAnalysisPanelComponent,
    VehicleTransactionTableComponent
],
  templateUrl: './vehicle-analysis.html',
  styleUrls: ['./vehicle-analysis.css', '../../../styles/global/_toast.css'],
})
export class VehicleAnalysisComponent implements OnInit {
  entityId: string | null = null;

  // Fleet selector (max 5)
  allVehicles: Vehicle[] = [];
  selectedFleets: string[] = [];
  fleetOptions: { label: string; value: string }[] = [];
  readonly MAX_FLEETS = 5;

  // Tab state — string values matching p-tab [value] bindings
  activeTabValue: PeriodTab = 'day';

  // Day
  dayDate: Date = new Date();

  // Week — start is user-picked, end is always start + 6 days
  weekStartDate: Date = this._currentWeekMonday();
  weekEndDate: Date = this._addDays(this._currentWeekMonday(), 6);

  // Month
  monthYear: number = new Date().getFullYear();
  monthMonth: number = new Date().getMonth() + 1;

  // Year
  yearYear: number = new Date().getFullYear();

  // Options
  months = MONTHS;
  years: YearOption[] = this._buildYearOptions();

  // Results
  analysisResult: VehicleAnalysisResponse | null = null;
  analysisLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dataService: DataService,
    private analysisService: VehicleAnalysisService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) { this.router.navigate(['/login']); return; }
    this.entityId = user.entityId;
    this._loadVehicles();
  }

  // ─────────────────────────────────────────────
  // Load vehicles for multi-select
  // ─────────────────────────────────────────────

  private _loadVehicles(): void {
    const payload = { entityId: this.entityId, page: 0, size: 500 };
    this.dataService
      .post<VehicleApiResponse>(API_ENDPOINTS.ALL_VEHICLES, payload, 'vehicles', false)
      .subscribe({
        next: (res) => {
          this.allVehicles = res.data;
          this.fleetOptions = res.data.map((v) => ({
            label: `${v.fleetNumber} — ${v.registrationNumber}`,
            value: v.fleetNumber,
          }));
          this.cdr.markForCheck();
        },
        error: () => this.messageService.add({
          severity: 'error', summary: 'Error', detail: 'Failed to load vehicles',
        }),
      });
  }

  // ─────────────────────────────────────────────
  // Fleet selection
  // ─────────────────────────────────────────────

  get canAnalyse(): boolean {
    return this.selectedFleets.length > 0 && this.selectedFleets.length <= this.MAX_FLEETS;
  }

  onFleetSelectionChange(): void {
    if (this.selectedFleets.length > this.MAX_FLEETS) {
      this.selectedFleets = this.selectedFleets.slice(0, this.MAX_FLEETS);
      this.messageService.add({
        severity: 'warn',
        summary: 'Limit reached',
        detail: `You can compare up to ${this.MAX_FLEETS} fleets`,
      });
    }
    this.analysisResult = null;
  }

  // ─────────────────────────────────────────────
  // Tab change
  // ─────────────────────────────────────────────

  onTabChange(value: string | any): void {
    this.activeTabValue = value as PeriodTab;
    this.analysisResult = null;
  }

  // ─────────────────────────────────────────────
  // Week range — auto-lock end to start + 6
  // ─────────────────────────────────────────────

  onWeekStartChange(): void {
    if (this.weekStartDate) {
      this.weekEndDate = this._addDays(new Date(this.weekStartDate), 6);
      this.cdr.markForCheck();
    }
  }

  get weekRangeLabel(): string {
    if (!this.weekStartDate) return '';
    return `${this._fmt(this.weekStartDate)} → ${this._fmt(this.weekEndDate)}`;
  }

  // ─────────────────────────────────────────────
  // Run analysis
  // ─────────────────────────────────────────────

  runAnalysis(): void {
    if (!this.canAnalyse) {
      this.messageService.add({
        severity: 'warn', summary: 'Select Fleet', detail: 'Please select at least one fleet',
      });
      return;
    }

    this.analysisLoading = true;
    this.analysisResult = null;
    this.cdr.markForCheck();

    this._buildRequest().subscribe({
      next: (result) => {
        this.analysisResult = result;
        this.analysisLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.analysisLoading = false;
        this.messageService.add({
          severity: 'error', summary: 'Analysis Failed',
          detail: err?.error?.detail ?? 'No data found for the selected period',
        });
        this.cdr.markForCheck();
      },
    });
  }

  private _buildRequest() {
    const entityId = this.entityId!;
    const fleets = this.selectedFleets;

    switch (this.activeTabValue) {
      case 'day':
        return this.analysisService.analyseDay(entityId, fleets, this._fmt(this.dayDate));
      case 'week':
        return this.analysisService.analyseWeek(entityId, fleets, this._fmt(this.weekStartDate));
      case 'month':
        return this.analysisService.analyseMonth(entityId, fleets, this.monthYear, this.monthMonth);
      case 'year':
        return this.analysisService.analyseYear(entityId, fleets, this.yearYear);
      default:
        return this.analysisService.analyseDay(entityId, fleets, this._fmt(this.dayDate));
    }
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private _fmt(d: Date): string {
    return d.toISOString().split('T')[0];
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
