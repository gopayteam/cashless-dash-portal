import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingStore {
  private readonly _loading = signal(false);
  loading = this._loading.asReadonly();

  setLoading(value: boolean) {
    this._loading.set(value);
  }

  start() {
    this._loading.set(true);
  }

  stop() {
    this._loading.set(false);
  }
}
