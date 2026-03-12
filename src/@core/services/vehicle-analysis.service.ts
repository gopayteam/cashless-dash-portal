// services/vehicle-analysis.service.ts
import { Injectable } from '@angular/core';
import { Observable, switchMap, of, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { API_ENDPOINTS as EDA_ENDPOINTS } from '../api/endpoints';
import {
  DayAnalysisRequest,
  WeekAnalysisRequest,
  MonthAnalysisRequest,
  YearAnalysisRequest,
  VehicleAnalysisResponse,
} from '../models/eda/vehicle-analysis.model';
import { PaymentRecord } from '../models/transactions/transactions.models';
import { PaymentsApiResponse } from '../models/transactions/payment_reponse.model';


/**
 * VehicleAnalysisService
 *
 * Strategy: Angular fetches transactions first (using the existing payments
 * endpoint), then POSTs them to the EDA module for analysis.
 *
 * This avoids needing a DB mirror in the EDA service — the client acts as
 * the data transport layer.
 *
 * For large date ranges (year), transactions are fetched in bulk (page=0,
 * size=5000) to cover the full period.
 */
@Injectable({ providedIn: 'root' })
export class VehicleAnalysisService {
  constructor(private dataService: DataService) { }

  // ─────────────────────────────────────────────
  // Day
  // ─────────────────────────────────────────────


  analyseDay(
    entityId: string,
    fleetNumbers: string[],
    date: string,             // YYYY-MM-DD
  ): Observable<VehicleAnalysisResponse> {
    return this._fetchTransactions(entityId, fleetNumbers, date, date).pipe(
      switchMap((transactions) => {
        const body: DayAnalysisRequest = {
          entityId,
          fleetNumbers,
          date,
          transactions,
        };
        return this.dataService.post<VehicleAnalysisResponse>(
          EDA_ENDPOINTS.VEHICLE_ANALYSE_DAY,
          body,
          'eda-day',
          true, // bypass cache — analysis should always be fresh
          true // use the ai url
        );
      }),
    );
  }

  // ─────────────────────────────────────────────
  // Week
  // ─────────────────────────────────────────────

  analyseWeek(
    entityId: string,
    fleetNumbers: string[],
    weekStart: string,        // YYYY-MM-DD (Monday)
  ): Observable<VehicleAnalysisResponse> {
    const weekEnd = this._addDays(weekStart, 6);
    return this._fetchTransactions(entityId, fleetNumbers, weekStart, weekEnd).pipe(
      switchMap((transactions) => {
        const body: WeekAnalysisRequest = {
          entityId,
          fleetNumbers,
          weekStart,
          transactions,
        };
        return this.dataService.post<VehicleAnalysisResponse>(
          EDA_ENDPOINTS.VEHICLE_ANALYSE_WEEK,
          body,
          'eda-week',
          true,
          true // use the ai url
        );
      }),
    );
  }

  // ─────────────────────────────────────────────
  // Month
  // ─────────────────────────────────────────────

  analyseMonth(
    entityId: string,
    fleetNumbers: string[],
    year: number,
    month: number,
  ): Observable<VehicleAnalysisResponse> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

    return this._fetchTransactions(entityId, fleetNumbers, startDate, endDate).pipe(
      switchMap((transactions) => {
        const body: MonthAnalysisRequest = {
          entityId,
          fleetNumbers,
          year,
          month,
          transactions,
        };
        return this.dataService.post<VehicleAnalysisResponse>(
          EDA_ENDPOINTS.VEHICLE_ANALYSE_MONTH,
          body,
          'eda-month',
          true,
          true // use the ai url
        );
      }),
    );
  }

  // ─────────────────────────────────────────────
  // Year
  // ─────────────────────────────────────────────

  analyseYear(
    entityId: string,
    fleetNumbers: string[],
    year: number,
  ): Observable<VehicleAnalysisResponse> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    return this._fetchTransactions(entityId, fleetNumbers, startDate, endDate, 5000).pipe(
      switchMap((transactions) => {
        const body: YearAnalysisRequest = {
          entityId,
          fleetNumbers,
          year,
          transactions,
        };
        return this.dataService.post<VehicleAnalysisResponse>(
          EDA_ENDPOINTS.VEHICLE_ANALYSE_YEAR,
          body,
          'eda-year',
          true,
          true // use the ai url
        );
      }),
    );
  }

  // ─────────────────────────────────────────────
  // Private — fetch transactions for all fleets
  // ─────────────────────────────────────────────

  private _fetchTransactions(
    entityId: string,
    fleetNumbers: string[],
    startDate: string,
    endDate: string,
    pageSize = 6000,
  ): Observable<PaymentRecord[]> {
    // Fetch one page covering the full range for all fleets combined.
    // The payload filter on the EDA side will split by fleetNumber.
    const payload = {
      entityId,
      startDate,
      endDate,
      page: 0,
      size: pageSize,
      sort: 'createdAt,ASC',
    };

    return this.dataService
      .post<PaymentsApiResponse>(EDA_ENDPOINTS.ALL_PAYMENTS, payload, 'transactions', false)
      .pipe(
        map((response) => {
          const all: PaymentRecord[] = response.data?.manifest ?? (response as any).data ?? [];
          // Client-side filter to only keep the requested fleets
          return all.filter((tx) => fleetNumbers.includes(tx.fleetNumber));
        }),
      );
  }

  // ─────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────

  private _addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  /** Returns the Monday of the week containing the given date */
  getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust for Sunday
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }

  /** Chart.js line chart options */
  getLineChartOptions(currency = 'KES'): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (ctx: any) =>
              `${ctx.dataset.label}: ${currency} ${ctx.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (val: number) => `${currency} ${val.toLocaleString()}`,
          },
        },
      },
    };
  }

  /** Chart.js bar chart options */
  getBarChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true } },
    };
  }

  /** Chart.js doughnut options */
  getDoughnutOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: (ctx: any) => `${ctx.label}: ${ctx.parsed}`,
          },
        },
      },
    };
  }
}
