// pages/marshal-performance/marshal-performance.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';


import { Router } from '@angular/router';
import { DataService } from '../../../../../@core/api/data.service';
import { AuthService } from '../../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../../@core/state/loading.store';
import { formatDateLocal } from '../../../../../@core/utils/date-time.util';
import { API_ENDPOINTS } from '../../../../../@core/api/endpoints';


// ── Models ──────────────────────────────────────────────────────────────────

export interface MarshalPerformance {
  approvedVehicleCount: number;
  marshalPhoneNumber: string;
  marshalName: string;
  amountCollected: number;
}

export interface MarshalDetailRecord {
  username: string;
  entityId: string;
  fleetNumber: string;
  amountCollected: number;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  totalRecords: number;
}

interface PaginatedData<T> {
  manifest?: T[];
  totalRecords?: number;
}

// ── Component ────────────────────────────────────────────────────────────────

// const MARSHAL_PERF_URL = 'http://localhost:3034/api/v1/org/approvals/marshal/perfomance';
// const MARSHAL_DETAIL_URL = 'http://localhost:3034/api/v1/org/approvals/marshal/perfomance/detail';

@Component({
  standalone: true,
  selector: 'app-marshal-performance',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule,
    TagModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  templateUrl: './marshall-performance.html',
  styleUrls: [
    './marshall-performance.css',
    '../../../../../styles/modules/_cards.css',
  ],
})
export class MarshalPerformanceComponent implements OnInit {

  // ── Date range ─────────────────────────────────────────────────────────────
  dateRange: Date[] = [];
  entityId: string | null = null;

  // ── Marshal list ───────────────────────────────────────────────────────────
  marshals: MarshalPerformance[] = [];
  marshalRows = 10;
  marshalFirst = 0;
  marshalTotal = 0;
  marshalLoading = false;

  // ── Detail panel ───────────────────────────────────────────────────────────
  selectedMarshal: MarshalPerformance | null = null;
  detailRecords: MarshalDetailRecord[] = [];
  detailRows = 10;
  detailFirst = 0;
  detailTotal = 0;
  detailLoading = false;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    public loadingStore: LoadingStore,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) { this.router.navigate(['/login']); return; }

    this.entityId = user.entityId;
    this.setDateRange();
    this.loadMarshals({ first: 0, rows: this.marshalRows });
  }

  // ── Date helpers ───────────────────────────────────────────────────────────

  setDateRange(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    this.dateRange = [lastWeek, today];
  }

  onDateRangeChange(): void {
    this.selectedMarshal = null;
    this.detailRecords = [];
    this.loadMarshals({ first: 0, rows: this.marshalRows });
  }

  // ── Load marshal list ──────────────────────────────────────────────────────

  loadMarshals(event: { first: number; rows: number }): void {
    if (!this.dateRange || this.dateRange.length < 2) return;

    const [start, end] = this.dateRange;
    this.marshalLoading = true;
    this.marshalFirst = event.first;
    this.marshalRows = event.rows;

    const payload = {
      entityId: this.entityId,
      startDate: formatDateLocal(start),
      endDate: formatDateLocal(end),
      size: event.rows,
      page: event.first / event.rows,
    };

    this.dataService
      .post<ApiResponse<MarshalPerformance[]>>(API_ENDPOINTS.MARSHAL_PERFORMANCE, payload, 'marshal-list')
      .subscribe({
        next: (res: any) => {
          // Support both flat array and paginated wrapper
          if (Array.isArray(res.data)) {
            this.marshals = res.data;
            this.marshalTotal = res.totalRecords ?? res.data.length;
          } else {
            this.marshals = res.data?.manifest ?? [];
            this.marshalTotal = res.data?.totalRecords ?? 0;
          }
          this.marshalLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Marshal list load failed', err);
          this.marshalLoading = false;
        },
      });
  }

  // ── Select marshal → load detail ──────────────────────────────────────────

  selectMarshal(marshal: MarshalPerformance): void {
    this.selectedMarshal = marshal;
    this.detailFirst = 0;
    this.loadDetail({ first: 0, rows: this.detailRows });
  }

  loadDetail(event: any): void {
    if (!this.selectedMarshal || !this.dateRange || this.dateRange.length < 2) return;

    const [start, end] = this.dateRange;
    this.detailLoading = true;
    this.detailFirst = event.first;
    this.detailRows = event.rows;

    const payload = {
      username: this.selectedMarshal.marshalPhoneNumber,
      startDate: formatDateLocal(start),
      endDate: formatDateLocal(end),
      size: event.rows,
      page: event.first / event.rows,
    };

    this.dataService
      .post<ApiResponse<MarshalDetailRecord[]>>(API_ENDPOINTS.MARSHAL_PERFORMANCE_DETAILS, payload, 'marshal-performance-detail')
      .subscribe({
        next: (res: any) => {
          if (Array.isArray(res.data)) {
            this.detailRecords = res.data;
            this.detailTotal = res.totalRecords ?? res.data.length;
          } else {
            this.detailRecords = res.data?.manifest ?? [];
            this.detailTotal = res.data?.totalRecords ?? 0;
          }
          this.detailLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Marshal detail load failed', err);
          this.detailLoading = false;
        },
      });
  }

  clearSelection(): void {
    this.selectedMarshal = null;
    this.detailRecords = [];
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  /** Colour bucket based on amount collected */
  minOf(a: number, b: number): number {
    return Math.min(a, b);
  }

  getPerformanceClass(amount: number): string {
    if (amount >= 5000) return 'perf-high';
    if (amount >= 2000) return 'perf-mid';
    return 'perf-low';
  }
}
