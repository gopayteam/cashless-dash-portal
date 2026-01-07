import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorStore {
  error = signal<string | null>(null);

  setError(message: string) {
    this.error.set(message);
  }

  clear() {
    this.error.set(null);
  }
}
