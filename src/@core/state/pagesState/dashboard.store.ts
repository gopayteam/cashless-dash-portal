import { Injectable, signal, effect } from '@angular/core';
import { DataService } from '../../api/data.service';
import { API_ENDPOINTS } from '../../api/endpoints';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  stats = signal<any>(null);
  loading = signal(false);

  constructor(private data: DataService) {
    effect(() => {
      this.loadStats();
    });
  }

  loadStats() {
    this.loading.set(true);
    this.data.get(API_ENDPOINTS.DASHBOARD).subscribe((data) => {
      this.stats.set(data);
      this.loading.set(false);
    });
  }
}
