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
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { ActionButtonComponent } from "../../../components/action-button/action-button";

@Component({
  standalone: true,
  selector: 'app-parcel-managers',
  templateUrl: './parcel-managers.html',
  styleUrls: [
    './parcel-managers.css',
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
    ActionButtonComponent,
  ],
})
export class ParcelManagersComponent implements OnInit {
  entityId: string | null = null;
  parcelManagers: ParcelManager[] = [];

  private lastEvent: any;

  // Pagination
  rows = 10;
  first = 0;
  totalRecords = 0;

  // Date filter (server-side)
  dateRange: Date[] = [];

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId
      // console.log('Logged in as:', user.username);
    } else {
      this.router.navigate(['/login']);
      console.log('No user logged in');
    }

    this.loadParcelManagers({ first: 0, rows: this.rows });
  }

  loadParcelManagers(event: any): void {
    this.lastEvent = event;
    this.fetchParcelManagers(false, event)
  }

  fetchParcelManagers(bypassCache: boolean, event: any): void {
    this.loadingStore.start();

    const page = event.first / event.rows;
    const [start, end] = this.dateRange || [];

    const payload = {
      entityId: this.entityId,
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
        'parcel-managers',
        bypassCache
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

  navigateToCreateManager(): void {
    this.router.navigate(['forms/add-parcel-manager'])
  }

  navigateToUpdateManager(manager: ParcelManager): void {
    // Pass the manager username as route param and full manager object as state
    this.router.navigate(['forms/update-parcel-manager', manager.username], {
      state: { manager }
    });
  }

  refresh(): void {
    if (this.lastEvent) {
      if (this.lastEvent)
        this.fetchParcelManagers(true, this.lastEvent);
    }
  }

}
