import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';

import { ParcelManager } from '../../../../@core/models/parcels/parcel_manager.model';
import { ParcelManagersApiResponse } from '../../../../@core/models/parcels/parcel_manager_response.model';
import { DialogModule } from 'primeng/dialog';

@Component({
  standalone: true,
  selector: 'app-parcel-managers',
  templateUrl: './parcel-managers.html',
  styleUrls: ['./parcel-managers.css', '../../../../styles/modules/_date_picker.css',
    '../../../../styles/modules/_filter_actions.css'
  ],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    DialogModule,
    ProgressSpinnerModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
  ],
})
export class ParcelManagersComponent implements OnInit {
  parcelManagers: ParcelManager[] = [];

  // Pagination
  rows = 10;
  first = 0;
  totalRecords = 0;

  // Date filter (server-side)
  dateRange: Date[] = [];

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private cdr: ChangeDetectorRef
  ) {}

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    this.loadParcelManagers({ first: 0, rows: this.rows });
  }

  loadParcelManagers(event: any): void {
    this.loadingStore.start();

    const page = event.first / event.rows;
    const [start, end] = this.dateRange || [];

    const payload = {
      entityId: 'GS000002',
      page,
      size: event.rows,
      transactionType: 'DEBIT',
      paymentStatus: 'PAID',
      startDate: start ? start.toISOString().split('T')[0] : null,
      endDate: end ? end.toISOString().split('T')[0] : null,
    };

    this.dataService
      .post<ParcelManagersApiResponse>(
        API_ENDPOINTS.ALL_PARCEL_MANAGERS,
        payload,
        'parcel-managers'
      )
      .subscribe({
        next: (response) => {
          this.parcelManagers = response.data;
          this.totalRecords = response.totalRecords;

          this.rows = event.rows;
          this.first = event.first;

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load parcel managers', err);
        },
        complete: () => this.loadingStore.stop(),
      });
  }

  applyFilters(): void {
    this.first = 0;
    this.loadParcelManagers({ first: 0, rows: this.rows });
  }

  resetFilters(): void {
    this.dateRange = [];
    this.applyFilters();
  }

  showManagerDialog = false;
  selectedManager: ParcelManager | null = null;

  openManagerDialog(manager: ParcelManager): void {
    this.selectedManager = manager;
    this.showManagerDialog = true;
  }
  closeManagerDialog(): void {
    this.showManagerDialog = false;
    this.selectedManager = null;
  }
}
