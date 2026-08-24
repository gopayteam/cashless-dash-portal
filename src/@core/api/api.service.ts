import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  /** Global toggle determining whether calls use normal apiBaseUrl or devApiBaseUrl */
  public static useDevUrl: boolean = environment.useDevApiUrl ?? false;

  private baseUrl = environment.apiBaseUrl;
  private devBaseUrl = environment.devApiBaseUrl || 'http://localhost:8080';
  private aiBaseUrl = environment.aiBaseUrl;

  constructor(private http: HttpClient) { }

  public setUseDevUrl(useDev: boolean): void {
    ApiService.useDevUrl = useDev;
  }

  public getUseDevUrl(): boolean {
    return ApiService.useDevUrl;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Resolves which base URL to use.
   * Priority:
   * 1. `useAi = true` -> `aiBaseUrl`
   * 2. `useDev` parameter if provided, otherwise global `ApiService.useDevUrl` -> `devBaseUrl`
   * 3. Default -> `baseUrl`
   */
  private resolveBase(useAi?: boolean, useDev?: boolean): string {
    if (useAi) return this.aiBaseUrl;
    const isDev = useDev !== undefined ? useDev : ApiService.useDevUrl;
    return isDev ? this.devBaseUrl : this.baseUrl;
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

  // ── Methods — all accept optional `useAi` and `useDev` flags ────────────

  get<T>(endpoint: string, params?: Record<string, any>, useAi?: boolean, useDev?: boolean): Observable<T> {
    return this.http.get<T>(`${this.resolveBase(useAi, useDev)}${endpoint}`, {
      params: this.buildParams(params),
    });
  }

  post<T>(endpoint: string, payload: any, useAi?: boolean, useDev?: boolean): Observable<T> {
    return this.http.post<T>(`${this.resolveBase(useAi, useDev)}${endpoint}`, payload);
  }

  postWithParams<T>(
    endpoint: string,
    payload: any,
    params?: Record<string, any>,
    useAi?: boolean,
    useDev?: boolean
  ): Observable<T> {
    return this.http.post<T>(`${this.resolveBase(useAi, useDev)}${endpoint}`, payload, {
      params: this.buildParams(params),
    });
  }

  postFormData<T>(endpoint: string, formData: FormData, useAi?: boolean, useDev?: boolean): Observable<T> {
    return this.http.post<T>(`${this.resolveBase(useAi, useDev)}${endpoint}`, formData);
  }

  put<T>(endpoint: string, payload: any, useAi?: boolean, useDev?: boolean): Observable<T> {
    return this.http.put<T>(`${this.resolveBase(useAi, useDev)}${endpoint}`, payload);
  }

  putWithParams<T>(
    endpoint: string,
    payload: any,
    params?: Record<string, any>,
    useAi?: boolean,
    useDev?: boolean
  ): Observable<T> {
    return this.http.put<T>(`${this.resolveBase(useAi, useDev)}${endpoint}`, payload, {
      params: this.buildParams(params),
    });
  }

  delete<T>(endpoint: string, useAi?: boolean, useDev?: boolean): Observable<T> {
    return this.http.delete<T>(`${this.resolveBase(useAi, useDev)}${endpoint}`);
  }

  deleteWithParams<T>(
    endpoint: string,
    params?: Record<string, any>,
    useAi?: boolean,
    useDev?: boolean
  ): Observable<T> {
    return this.http.delete<T>(`${this.resolveBase(useAi, useDev)}${endpoint}`, {
      params: this.buildParams(params),
    });
  }
}
