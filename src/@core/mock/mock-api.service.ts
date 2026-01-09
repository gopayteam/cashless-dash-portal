import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { MOCK_DB } from './mock-db';

@Injectable({ providedIn: 'root' })
export class MockApiService {
  get(endpoint: string): Observable<any> {
    switch (endpoint) {
      case '/api/payment/passenger/manifest':
        return of(MOCK_DB.recent_transactions).pipe(delay(500));

      case '/api/payment/transactions/stats':
        return of(MOCK_DB.stats).pipe(delay(500));

      case '/api/payment/transactions/stats-by-period':
        return of(MOCK_DB.stats_by_period).pipe(delay(500));

      case '/api/payment/transactions/stats-per-category':
        return of(MOCK_DB.stats_per_category).pipe(delay(500));

      default:
        console.warn(`MockApiService: Unknown endpoint ${endpoint}`);
        return of(null);
    }
  }

  post(endpoint: string, payload: any): Observable<any> {
    switch (endpoint) {
      case '/api/payment/passenger/manifest':
        return of(MOCK_DB.recent_transactions).pipe(delay(500));

      default:
        console.warn(`MockApiService: Unknown endpoint ${endpoint}`);
        return of(null);
    }
  }
}
