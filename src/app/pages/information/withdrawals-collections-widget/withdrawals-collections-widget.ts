import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { WithdrawalsCollectionsResponse } from '../../../../@core/models/analytics/withdrawals-collections-response.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { formatDateLocal } from '../../../../@core/utils/date-time.util';

@Component({
  selector: 'app-withdrawals-collections-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, DatePickerModule, ProgressSpinnerModule],
  templateUrl: './withdrawals-collections-widget.html',
  styleUrls: ['./withdrawals-collections-widget.css'],
})
export class WithdrawalsCollectionsWidgetComponent implements OnInit {
  entityId: string | null = null;

  selectedDate: Date = new Date();
  today: Date = new Date();

  totalCollected: number = 0;
  totalWithdrawn: number = 0;
  hasLoaded: boolean = false;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  get netDifference(): number {
    return this.totalCollected - this.totalWithdrawn;
  }

  // Bar widths as a percentage of whichever total is larger, for the chart
  get collectedBarPct(): number {
    const max = Math.max(this.totalCollected, this.totalWithdrawn, 1);
    return (this.totalCollected / max) * 100;
  }

  get withdrawnBarPct(): number {
    const max = Math.max(this.totalCollected, this.totalWithdrawn, 1);
    return (this.totalWithdrawn / max) * 100;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.entityId = user ? user.entityId : null;
    this.fetch();
  }

  onDateChange(): void {
    this.fetch();
  }

  refresh(): void {
    this.fetch();
  }

  private fetch(): void {
    if (!this.entityId) return;

    const params = {
      entityId: this.entityId,
      date: formatDateLocal(this.selectedDate),
    };

    this.loadingStore.start();

    this.dataService
      .get<WithdrawalsCollectionsResponse>(API_ENDPOINTS.WITHDRAWALS_COLLECTIONS, params, 'withdrawals-collections')
      .subscribe({
        next: (response) => {
          this.totalCollected = response.data.totalAmountCollected ?? 0;
          this.totalWithdrawn = response.data.totalAmountWithdrawn ?? 0;
          this.hasLoaded = true;
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load withdrawals vs collections', err);
          this.totalCollected = 0;
          this.totalWithdrawn = 0;
          this.hasLoaded = true;
          this.loadingStore.stop();
        },
      });
  }
}
