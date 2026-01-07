import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { MockApiService } from '../mock/mock-api.service';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CacheService } from '../cache/cache.service';

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(
    private api: ApiService,
    private mockApi: MockApiService,
    private cache: CacheService
  ) {}

  // get<T>(endpoint: string): Observable<T> {
  //   const request$ = environment.useMockApi
  //     ? this.mockApi.get(endpoint)
  //     : this.api.get<T>(endpoint);

  //   return this.cache.get(endpoint, request$);
  // }

  get<T>(endpoint: string, context?: string): Observable<T> {
    const key = `${endpoint}:${context ?? 'default'}`;

    const request$ = environment.useMockApi
      ? this.mockApi.get(endpoint)
      : this.api.get<T>(endpoint);

    return this.cache.get(key, request$);
  }
}
