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

  get<T>(
    endpoint: string,
    params?: Record<string, any>,
    context?: string,
    bypassCache: boolean = false,
    useAi: boolean = false
  ): Observable<T> {
    const key = `${endpoint}:GET:${JSON.stringify(params)}:${context ?? 'default'}`;
    const request$ = environment.useMockApi
      ? this.mockApi.get(endpoint)
      : this.api.get<T>(endpoint, params, useAi);

    return bypassCache ? request$ : this.cache.get(key, request$);
  }

  getWithoutParams<T>(
    endpoint: string,
    context?: string,
    bypassCache: boolean = false,
    useAi: boolean = false
  ): Observable<T> {
    const key = `${endpoint}:GET:NO_PARAMS:${context ?? 'default'}`;
    const request$ = environment.useMockApi
      ? this.mockApi.get(endpoint)
      : this.api.get<T>(endpoint, undefined, useAi);

    return bypassCache ? request$ : this.cache.get(key, request$);
  }

  post<T>(
    endpoint: string,
    payload: any,
    context?: string,
    bypassCache: boolean = false,
    useAi: boolean = false
  ): Observable<T> {
    const key = `${endpoint}:POST:${JSON.stringify(payload)}:${context ?? 'default'}`;
    const request$ = environment.useMockApi
      ? this.mockApi.post(endpoint, payload)
      : this.api.post<T>(endpoint, payload, useAi);

    return bypassCache ? request$ : this.cache.get(key, request$);
  }

  postWithParams<T>(
    endpoint: string,
    payload: any,
    params?: Record<string, any>,
    context?: string,
    useAi: boolean = false
  ): Observable<T> {
    const key = `${endpoint}:POST_PARAMS:${JSON.stringify(payload)}:${JSON.stringify(params)}:${context ?? 'default'}`;
    const request$ = environment.useMockApi
      ? this.mockApi.post(endpoint, payload)
      : this.api.postWithParams<T>(endpoint, payload, params, useAi);

    return this.cache.get(key, request$);
  }

  postFormData<T>(
    endpoint: string,
    formData: FormData,
    context?: string,
    bypassCache: boolean = true,
    useAi: boolean = false
  ): Observable<T> {
    const key = `${endpoint}:POST_FORMDATA:${context ?? 'default'}`;
    const request$ = environment.useMockApi
      ? this.mockApi.post(endpoint, formData)
      : this.api.postFormData<T>(endpoint, formData, useAi);

    return bypassCache ? request$ : this.cache.get(key, request$);
  }

  put<T>(
    endpoint: string,
    payload: any,
    context?: string,
    bypassCache: boolean = false,
    useAi: boolean = false
  ): Observable<T> {
    const key = `${endpoint}:PUT:${JSON.stringify(payload)}:${context ?? 'default'}`;
    const request$ = environment.useMockApi
      ? this.mockApi.put(endpoint, payload)
      : this.api.put<T>(endpoint, payload, useAi);

    return bypassCache ? request$ : this.cache.get(key, request$);
  }

  putWithParams<T>(
    endpoint: string,
    payload: any,
    params?: Record<string, any>,
    context?: string,
    bypassCache: boolean = false,
    useAi: boolean = false
  ): Observable<T> {
    const key = `${endpoint}:PUT_PARAMS:${JSON.stringify(payload)}:${JSON.stringify(params)}:${context ?? 'default'}`;
    const request$ = environment.useMockApi
      ? this.mockApi.put(endpoint, payload)
      : this.api.putWithParams<T>(endpoint, payload, params, useAi);

    return bypassCache ? request$ : this.cache.get(key, request$);
  }

  delete<T>(
    endpoint: string,
    context?: string,
    bypassCache: boolean = true,
    useAi: boolean = false
  ): Observable<T> {
    const key = `${endpoint}:DELETE:${context ?? 'default'}`;
    const request$ = environment.useMockApi
      ? this.mockApi.delete(endpoint)
      : this.api.delete<T>(endpoint, useAi);

    return bypassCache ? request$ : this.cache.get(key, request$);
  }

  deleteWithParams<T>(
    endpoint: string,
    params?: Record<string, any>,
    context?: string,
    bypassCache: boolean = true,
    useAi: boolean = false
  ): Observable<T> {
    const key = `${endpoint}:DELETE_PARAMS:${JSON.stringify(params)}:${context ?? 'default'}`;
    const request$ = environment.useMockApi
      ? this.mockApi.delete(endpoint)
      : this.api.deleteWithParams<T>(endpoint, params, useAi);

    return bypassCache ? request$ : this.cache.get(key, request$);
  }
}
