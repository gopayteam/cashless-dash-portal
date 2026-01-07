import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MOCK_DB } from './mock-db';
import { environment } from '../../environments/environment';

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!environment.useMockApi) {
      return next.handle(req);
    }

    if (req.url.endsWith('/dashboard')) {
      return of(new HttpResponse({ status: 200, body: MOCK_DB.dashboard })).pipe(delay(500));
    }

    return next.handle(req);
  }
}
