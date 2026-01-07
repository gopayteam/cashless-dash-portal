import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, Observable<any>>();

  get<T>(key: string, request$: Observable<T>): Observable<T> {
    if (!this.cache.has(key)) {
      this.cache.set(key, request$.pipe(shareReplay(1)));
    }
    return this.cache.get(key)!;
  }

  clear(key?: string) {
    key ? this.cache.delete(key) : this.cache.clear();
  }
}
