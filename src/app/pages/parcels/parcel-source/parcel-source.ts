import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';

import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { DataService } from '../../../../@core/api/data.service';
import { LoadingStore } from '../../../../@core/state/loading.store';

import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { ParcelStage } from '../../../../@core/models/parcels/parcel_stage.model';
import { ParcelStageApiResponse } from '../../../../@core/models/parcels/parcel_stage_response';
import { AuthService } from '../../../../@core/services/auth.service';
import { formatDateLocal } from '../../../../@core/utils/date-time.util';
import { ActionButtonComponent } from "../../../components/action-button/action-button";

@Component({
  standalone: true,
  selector: 'app-parcel-source-stages',
  templateUrl: './parcel-source.html',
  styleUrls: [
    './parcel-source.css',
    '../../../../styles/modules/_filter_actions.css'
  ],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CardModule,
    DialogModule,
    ProgressSpinnerModule,
    ButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    ActionButtonComponent
  ],
})
export class ParcelSourceComponent implements OnInit {
  entityId: string | null = null;
  stages: ParcelStage[] = [];

  private lastEvent: any;

  // Pagination
  rows = 10;
  first = 0;
  totalRecords = 0;

  // Date filter
  dateRange: Date[] = [];

  // private readonly ENTITY_ID = 'GS000002';

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

    this.setDefaultDateRange();
    this.loadStages({ first: 0, rows: this.rows });

    // this.router.events.subscribe(() => {
    //   if (this.lastEvent) {
    //     this.fetchStages(true, this.lastEvent);
    //   } else {
    //     this.fetchStages(true, { first: 0, rows: this.rows });
    //   }
    // });


  }

  loadStages(event: any): void {
    this.lastEvent = event;
    this.fetchStages(false, event)
  }

  fetchStages(bypassCache: boolean, event?: any): void {
    this.loadingStore.start();

    const page = (event && event.first !== undefined)
      ? event.first / event.rows
      : 0;

    const size = event?.rows || this.rows;
    const [start, end] = this.dateRange || [];

    const params = {
      entityId: this.entityId,
      page,
      size,
      startDate: start ? formatDateLocal(start) : null,
      endDate: end ? formatDateLocal(end) : null,
    };

    this.dataService
      .get<ParcelStageApiResponse>(
        API_ENDPOINTS.ALL_PARCEL_SOURCES,
        params,
        'parcel-source-stages',
        bypassCache
      )
      .subscribe({
        next: (response) => {
          this.stages = response.data;
          this.totalRecords = response.totalRecords;
          this.rows = size;
          this.first = event?.first || 0;
          this.cdr.detectChanges();
        },
        error: () => this.loadingStore.stop(),
        complete: () => this.loadingStore.stop(),
      });
  }


  setDefaultDateRange(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    this.dateRange = [lastWeek, today];
  }


  applyFilters(): void {
    this.first = 0;
    this.loadStages({ first: 0, rows: this.rows });
  }

  resetFilters(): void {
    this.dateRange = [];
    this.applyFilters();
  }

  showStageDialog = false;
  selectedStage: ParcelStage | null = null;

  openStageDialog(stage: ParcelStage): void {
    this.selectedStage = stage;
    this.showStageDialog = true;
  }
  closeStageDialog(): void {
    this.showStageDialog = false;
    this.selectedStage = null;
  }

  refresh(): void {
    if (this.lastEvent) {
      this.fetchStages(true, this.lastEvent);
    } else {
      this.fetchStages(true, { first: 0, rows: this.rows });
    }
  }
}
