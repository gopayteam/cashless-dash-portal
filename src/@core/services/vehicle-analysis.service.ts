// @core/services/vehicle-analysis.service.ts
import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { map, tap } from 'rxjs/operators';
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
 * Strategy:
 *  1. Fetch PaymentRecord[] for the requested period + fleets (_fetchTransactions)
 *  2. POST them to the EDA service for analysis
 *  3. tap() the EDA response to attach the same PaymentRecord[] onto
 *     VehicleAnalysisResponse.transactions — so the template can bind directly
 *     to `analysisResult.transactions` without any extra HTTP call.
 */
@Injectable({ providedIn: 'root' })
export class VehicleAnalysisService {

  constructor(private dataService: DataService) {}

  // ─────────────────────────────────────────────
  // Day
  // ─────────────────────────────────────────────

  analyseDay(
    entityId: string,
    fleetNumbers: string[],
    date: string,            // YYYY-MM-DD
  ): Observable<VehicleAnalysisResponse> {
    return this._fetchTransactions(entityId, fleetNumbers, date, date).pipe(
      switchMap((transactions) => {
        const body: DayAnalysisRequest = { entityId, fleetNumbers, date, transactions };
        return this.dataService
          .post<VehicleAnalysisResponse>(EDA_ENDPOINTS.VEHICLE_ANALYSE_DAY, body, 'eda-day', true, true)
          .pipe(tap(res => { res.transactions = transactions; }));
      }),
    );
  }

  // ─────────────────────────────────────────────
  // Week
  // ─────────────────────────────────────────────

  analyseWeek(
    entityId: string,
    fleetNumbers: string[],
    weekStart: string,       // YYYY-MM-DD (Monday)
  ): Observable<VehicleAnalysisResponse> {
    const weekEnd = this._addDays(weekStart, 6);
    return this._fetchTransactions(entityId, fleetNumbers, weekStart, weekEnd).pipe(
      switchMap((transactions) => {
        const body: WeekAnalysisRequest = { entityId, fleetNumbers, weekStart, transactions };
        return this.dataService
          .post<VehicleAnalysisResponse>(EDA_ENDPOINTS.VEHICLE_ANALYSE_WEEK, body, 'eda-week', true, true)
          .pipe(tap(res => { res.transactions = transactions; }));
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
    const startDate   = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate     = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

    return this._fetchTransactions(entityId, fleetNumbers, startDate, endDate).pipe(
      switchMap((transactions) => {
        const body: MonthAnalysisRequest = { entityId, fleetNumbers, year, month, transactions };
        return this.dataService
          .post<VehicleAnalysisResponse>(EDA_ENDPOINTS.VEHICLE_ANALYSE_MONTH, body, 'eda-month', true, true)
          .pipe(tap(res => { res.transactions = transactions; }));
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
    const endDate   = `${year}-12-31`;

    return this._fetchTransactions(entityId, fleetNumbers, startDate, endDate, 5000).pipe(
      switchMap((transactions) => {
        const body: YearAnalysisRequest = { entityId, fleetNumbers, year, transactions };
        return this.dataService
          .post<VehicleAnalysisResponse>(EDA_ENDPOINTS.VEHICLE_ANALYSE_YEAR, body, 'eda-year', true, true)
          .pipe(tap(res => { res.transactions = transactions; }));
      }),
    );
  }

  // ─────────────────────────────────────────────
  // Private — fetch transactions for the period
  // ─────────────────────────────────────────────

  private _fetchTransactions(
    entityId: string,
    fleetNumbers: string[],
    startDate: string,
    endDate: string,
    pageSize = 6000,
  ): Observable<PaymentRecord[]> {
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
          // Client-side filter — only keep the requested fleet numbers
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

  getWeekStart(date: Date): string {
    const d   = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }

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
          ticks: { callback: (val: number) => `${currency} ${val.toLocaleString()}` },
        },
      },
    };
  }

  getBarChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true } },
    };
  }

  getDoughnutOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed}` },
        },
      },
    };
  }
}
