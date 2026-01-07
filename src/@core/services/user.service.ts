import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService } from '../api/api.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: ApiService) {}

  getOne<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`);
  }

  getById<T>(endpoint: string, payload: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, payload);
  }
}
