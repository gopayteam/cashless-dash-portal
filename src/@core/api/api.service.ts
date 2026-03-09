import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;
  private aiBaseUrl = environment.aiBaseUrl;   // ← add this to your environment files

  constructor(private http: HttpClient) { }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Resolves which base URL to use.
   * Pass `true` for any AI service call; omit or pass `false` for standard API.
   */
  private resolveBase(useAi?: boolean): string {
    return useAi ? this.aiBaseUrl : this.baseUrl;
  }

  private buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== null && value !== undefined) {
        httpParams = httpParams.set(key, value);
      }
    });
    return httpParams;
  }

  // ── Methods — all accept an optional `useAi` flag ───────────────────────

  get<T>(endpoint: string, params?: Record<string, any>, useAi?: boolean): Observable<T> {
    return this.http.get<T>(`${this.resolveBase(useAi)}${endpoint}`, {
      params: this.buildParams(params),
    });
  }

  post<T>(endpoint: string, payload: any, useAi?: boolean): Observable<T> {
    return this.http.post<T>(`${this.resolveBase(useAi)}${endpoint}`, payload);
  }

  postWithParams<T>(
    endpoint: string,
    payload: any,
    params?: Record<string, any>,
    useAi?: boolean
  ): Observable<T> {
    return this.http.post<T>(`${this.resolveBase(useAi)}${endpoint}`, payload, {
      params: this.buildParams(params),
    });
  }

  postFormData<T>(endpoint: string, formData: FormData, useAi?: boolean): Observable<T> {
    return this.http.post<T>(`${this.resolveBase(useAi)}${endpoint}`, formData);
  }

  put<T>(endpoint: string, payload: any, useAi?: boolean): Observable<T> {
    return this.http.put<T>(`${this.resolveBase(useAi)}${endpoint}`, payload);
  }

  putWithParams<T>(
    endpoint: string,
    payload: any,
    params?: Record<string, any>,
    useAi?: boolean
  ): Observable<T> {
    return this.http.put<T>(`${this.resolveBase(useAi)}${endpoint}`, payload, {
      params: this.buildParams(params),
    });
  }

  delete<T>(endpoint: string, useAi?: boolean): Observable<T> {
    return this.http.delete<T>(`${this.resolveBase(useAi)}${endpoint}`);
  }

  deleteWithParams<T>(
    endpoint: string,
    params?: Record<string, any>,
    useAi?: boolean
  ): Observable<T> {
    return this.http.delete<T>(`${this.resolveBase(useAi)}${endpoint}`, {
      params: this.buildParams(params),
    });
  }
}
