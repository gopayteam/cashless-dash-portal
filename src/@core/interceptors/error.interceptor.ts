import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { ErrorStore } from '../state/error.store';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private errorStore: ErrorStore) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = error.error?.message || 'Something went wrong';
        this.errorStore.setError(message);
        return throwError(() => error);
      })
    );
  }
}
