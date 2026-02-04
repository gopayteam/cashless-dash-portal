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
  ) { }

  /**
   * GET with optional params + cache
   */
  get<T>(
    endpoint: string,
    params?: Record<string, any>,
    context?: string
  ): Observable<T> {
    const key = `${endpoint}:GET:${JSON.stringify(params)}:${context ?? 'default'}`;

    const request$ = environment.useMockApi
      ? this.mockApi.get(endpoint)
      : this.api.get<T>(endpoint, params);

    return this.cache.get(key, request$);
  }

  /**
   * POST with payload + cache
   */
  post<T>(
    endpoint: string,
    payload: any,
    context?: string
  ): Observable<T> {
    const key = `${endpoint}:POST:${JSON.stringify(payload)}:${context ?? 'default'}`;

    const request$ = environment.useMockApi
      ? this.mockApi.post(endpoint, payload)
      : this.api.post<T>(endpoint, payload);

    return this.cache.get(key, request$);
  }

  /**
 * POST with payload + params + cache
 */
  postWithParams<T>(
    endpoint: string,
    payload: any,
    params?: Record<string, any>,
    context?: string
  ): Observable<T> {
    const key = `${endpoint}:POST_PARAMS:${JSON.stringify(payload)}:${JSON.stringify(params)}:${context ?? 'default'}`;

    const request$ = environment.useMockApi
      ? this.mockApi.post(endpoint, payload) // or create mock version too
      : this.api.postWithParams<T>(endpoint, payload, params);

    return this.cache.get(key, request$);
  }


}
