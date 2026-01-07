import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { LoadingStore } from '../state/loading.store';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingStore: LoadingStore) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.loadingStore.setLoading(true);

    return next.handle(req).pipe(finalize(() => this.loadingStore.setLoading(false)));
  }
}
