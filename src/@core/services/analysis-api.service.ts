import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnomalyFlag {
  type: 'DUPLICATE_RECEIPT' | 'UNUSUAL_AMOUNT' | 'RAPID_DRIVER_REPEAT' | 'OUTSIDE_BUSINESS_HOURS';
  label: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Transaction {
  id: number;
  receipt: string;
  customer_name: string;
  fleet_number: string;
  transaction_type: string;
  payment_status: string;
  amount: number;
  trip_id: string;
  pickup: string;
  drop_off: string;
  driver_username: string;
  created_at: string;
  updated_at: string;
  anomalies: AnomalyFlag[];
}

export interface KpiSummary {
  total_volume: number;
  transaction_count: number;
  average_amount: number;
  max_amount: number;
  min_amount: number;
  flagged_count: number;
  paid_count: number;
  unpaid_count: number;
  unique_fleets: number;
  unique_drivers: number;
}

export interface FleetBreakdown {
  fleet: string;
  total: number;
  count: number;
  avg: number;
  flagged: number;
  pct: number;
}

export interface TrendPoint {
  label: string;
  total: number;
  count: number;
  flagged: number;
  avg: number;
}

export interface TransactionPage {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  transactions: Transaction[];
}

export interface AnomalyReport {
  total_flagged: number;
  by_type: Record<string, Transaction[]>;
  all_flagged: Transaction[];
}

export interface FilterResult {
  window_label: string;
  transactions: Transaction[];
  total_volume: number;
  transaction_count: number;
  flagged_count: number;
  average_amount: number;
  peak_amount: number;
  unique_fleets: number;
  unique_drivers: number;
}

export interface UploadResponse {
  message: string;
  filename: string;
  record_count: number;
  flagged_count: number;
  uploaded_at: string;
}

@Injectable({ providedIn: 'root' })
export class AnalysisApiService {
  private base = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  health() {
    return this.http.get<any>(`${this.base}/health`);
  }

  upload(file: File): Observable<UploadResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadResponse>(`${this.base}/upload`, form);
  }

  clearData() {
    return this.http.delete(`${this.base}/upload`);
  }

  getKpi(): Observable<KpiSummary> {
    return this.http.get<KpiSummary>(`${this.base}/kpi`);
  }

  getTransactions(page = 1, pageSize = 50, fleet?: string, flaggedOnly?: boolean): Observable<TransactionPage> {
    let params = new HttpParams().set('page', page).set('page_size', pageSize);
    if (fleet) params = params.set('fleet', fleet);
    if (flaggedOnly) params = params.set('flagged_only', 'true');
    return this.http.get<TransactionPage>(`${this.base}/transactions`, { params });
  }

  getAnomalies(): Observable<AnomalyReport> {
    return this.http.get<AnomalyReport>(`${this.base}/anomalies`);
  }

  getFleet(): Observable<FleetBreakdown[]> {
    return this.http.get<FleetBreakdown[]>(`${this.base}/fleet`);
  }

  getTrends(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Observable<TrendPoint[]> {
    return this.http.get<TrendPoint[]>(`${this.base}/trends/${period}`);
  }

  filterHourly(fromDate: string, fromHour: number, toDate: string, toHour: number): Observable<FilterResult> {
    const params = new HttpParams()
      .set('from_date', fromDate)
      .set('from_hour', fromHour)
      .set('to_date', toDate)
      .set('to_hour', toHour);
    return this.http.get<FilterResult>(`${this.base}/filter/hourly`, { params });
  }

  filterWeekly(date: string): Observable<FilterResult> {
    return this.http.get<FilterResult>(`${this.base}/filter/weekly`, { params: { date } });
  }

  filterMonthly(year: number, month: number): Observable<FilterResult> {
    return this.http.get<FilterResult>(`${this.base}/filter/monthly`, {
      params: new HttpParams().set('year', year).set('month', month),
    });
  }

  filterYearly(year: number): Observable<FilterResult> {
    return this.http.get<FilterResult>(`${this.base}/filter/yearly`, { params: { year } });
  }

  getAvailableYears(): Observable<{ years: number[] }> {
    return this.http.get<{ years: number[] }>(`${this.base}/meta/years`);
  }
}
