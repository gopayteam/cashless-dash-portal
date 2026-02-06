import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type Agent =
  | "DASHMASTER"
  | "APPROVER"
  | "INSPECTOR"
  | "DRIVER"
  | "PARCEL"
  | "PASSENGER"
  | "MARSHAL"
  | "ADMIN"
  | "CONDUCTOR"
  | "INVESTOR";

export interface BroadcastRequest {
  entityId: string;
  agent: Agent;
  message: string;
  title: string;
}

export interface BroadcastResponse {
  status: number;
  message: string;
  data: any[];
  totalRecords: number;
}

const MyResponse = {
  "status": 0,
  "message": "Process Finished after sending notification to 537users",
  "data": [],
  "totalRecords": 0
}

@Injectable({
  providedIn: 'root'
})
export class BroadcastService {
  private readonly API_URL = '/api/broadcast'; // Update with your actual endpoint

  constructor(private http: HttpClient) { }



  /**
   * Send a broadcast notification
   * @param request The broadcast request payload
   * @returns Observable with the broadcast response
   */
  sendBroadcast(request: BroadcastRequest): Observable<BroadcastResponse> {
    return this.http.post<BroadcastResponse>(this.API_URL, request)
      .pipe(
        map(response => {
          // Validate response structure
          // if (typeof response.status === 'undefined') {
          //   throw new Error('Invalid response format');
          // }
          return MyResponse;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get broadcast history (example additional method)
   * @param agentType Optional filter by agent type
   * @returns Observable with broadcast history
   */
  getBroadcastHistory(agentType?: Agent): Observable<any[]> {
    const url = agentType
      ? `${this.API_URL}/history?agent=${agentType}`
      : `${this.API_URL}/history`;

    return this.http.get<any[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get agent statistics (example additional method)
   * @returns Observable with agent statistics
   */
  getAgentStats(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/stats`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors
   * @param error The HTTP error response
   * @returns Observable that errors with a user-friendly message
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Invalid request. Please check your input.';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        errorMessage = 'Broadcast endpoint not found.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.error?.message || `Error Code: ${error.status}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
