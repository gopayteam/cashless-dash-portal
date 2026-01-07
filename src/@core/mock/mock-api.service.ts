import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { MOCK_DB } from './mock-db';

@Injectable({ providedIn: 'root' })
export class MockApiService {
  get(endpoint: string): Observable<any> {
    switch (endpoint) {
      case '/users':
        return of(MOCK_DB.users).pipe(delay(500));

      case '/transactions':
        return of(MOCK_DB.transactions).pipe(delay(500));

      case '/dashboard':
        return of(MOCK_DB.dashboard).pipe(delay(500));

      default:
        console.warn(`MockApiService: Unknown endpoint ${endpoint}`);
        return of(null);
    }
  }
}
