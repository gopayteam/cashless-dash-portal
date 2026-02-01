import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService } from '../api/api.service';
import { AuthUser } from '../models/auth/auth-user.model';
import { AuthResponse } from '../models/auth/authResponse.model';
import { LoginRequest } from '../models/auth/signin-request.model';
import { API_ENDPOINTS } from '../api/endpoints';
import { SignUpRequest } from '../models/auth/signup-request.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'auth_user';
  private readonly baseUrl = environment.apiBaseUrl;

  /* =======================
     SIGNAL STATE
  ======================= */

  private tokenSignal = signal<string | null>(this.getStoredToken());
  private userSignal = signal<AuthUser | null>(this.getStoredUser());

  token = computed(() => this.tokenSignal());
  currentUser = computed(() => this.userSignal());
  isAuthenticated = computed(() => !!this.tokenSignal());

  /** Roles derived from stored user */
  roles = computed(() =>
    this.userSignal()?.roles?.map(r => r.name) ?? []
  );

  constructor(
    private api: ApiService,
    private router: Router
  ) { }

  /* =======================
     AUTH ACTIONS
  ======================= */

  /**
   * Sign in user
   * FIXED: Now properly handles API status codes
   */
  signIn(payload: LoginRequest): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>(API_ENDPOINTS.AUTH_LOGIN, payload)
      .pipe(
        tap(res => {
          // SUCCESS: status === 0 means login successful
          if (res.status === 0 && res.data) {
            this.setSession(res.data);
          }
          // FAILURE: status !== 0 means login failed
          else {
            // Throw error to trigger the error handler
            throw {
              error: {
                message: res.message || 'Invalid login credentials',
                status: res.status
              }
            };
          }
        }),
        catchError(err => {
          console.error('Login failed', err);
          return throwError(() => err);
        })
      );
  }

  /**
   * Sign up new user
   * FIXED: Now properly handles API status codes
   */
  signUp(userData: SignUpRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>(API_ENDPOINTS.REGISTER_USER, userData).pipe(
      tap(response => {
        // SUCCESS: status === 0 means registration successful
        if (response.status === 0 && response.data) {
          this.setSession(response.data);
        }
        // FAILURE: status !== 0 means registration failed
        else {
          throw {
            error: {
              message: response.message || 'Registration failed',
              status: response.status
            }
          };
        }
      }),
      catchError(error => {
        console.error('Sign up error:', error);
        return throwError(() => error);
      })
    );
  }

  signOut(): void {
    localStorage.clear();
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  /* =======================
     SESSION MANAGEMENT
  ======================= */

  /**
  * Set authentication session
  */
  private setSession(user: AuthUser): void {
    localStorage.setItem(this.TOKEN_KEY, user.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.tokenSignal.set(user.token);
    this.userSignal.set(user);
  }

  /**
   * Get stored token from localStorage
   */
  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  /* =======================
     ROLE & PERMISSION HELPERS
  ======================= */

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.roles().includes(r));
  }

  /* =======================
     JWT HELPERS
  ======================= */

  isTokenExpired(): boolean {
    const token = this.tokenSignal();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() / 1000 >= payload.exp;
    } catch {
      return true;
    }
  }

  /**
   * Refresh token (implement if your API supports it)
   */
  refreshToken(): Observable<AuthResponse> {
    return this.api.post<AuthResponse>(API_ENDPOINTS.REFRESH_TOKEN, {}).pipe(
      tap(response => {
        if (response.status === 0 && response.data) {
          this.setSession(response.data);
        } else {
          throw {
            error: {
              message: response.message || 'Token refresh failed',
              status: response.status
            }
          };
        }
      })
    );
  }

  /* =======================
     GENERIC API CALL (OPTIONAL)
  ======================= */

  get<T>(endpoint: string): Observable<T> {
    return this.api.get<T>(`${this.baseUrl}${endpoint}`);
  }
}
