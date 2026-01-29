// pages/routes-stages/routes-stages.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';

import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { Stage } from '../../../../@core/models/locations/stage.model';
import { StagesResponse } from '../../../../@core/models/locations/state_response.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-stages',
  templateUrl: './stages.html',
  styleUrls: [
    './stages.css',

  ],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    DialogModule,
    TooltipModule,
    ProgressSpinnerModule,
    InputTextModule,
  ],
})
export class LocationStagesComponent implements OnInit {
  entityId: string | null = null;
  // Stages Data
  stages: Stage[] = [];
  stagesTotalRecords = 0;
  stagesRows = 10;
  stagesFirst = 0;
  stagesSearchTerm = '';

  // Stats Cards
  statsCards: any[] = [];

  // Dialogs
  displayStageDialog = false;
  selectedStage: Stage | null = null;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

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

    this.loadStages({ first: 0, rows: this.stagesRows });
  }

  // ================= STAGES METHODS =================
  loadStages(event: any): void {
    this.loadingStore.start();

    const page = event.first / event.rows;

    const payload = {
      entityId: this.entityId,
      page,
      size: event.rows,
    };

    this.dataService
      .post<StagesResponse>(API_ENDPOINTS.ALL_STAGES, payload, 'stages')
      .subscribe({
        next: (response) => {
          let filteredStages = response.data;

          // Apply search filter
          if (this.stagesSearchTerm) {
            const term = this.stagesSearchTerm.toLowerCase();
            filteredStages = filteredStages.filter((s) =>
              s.name.toLowerCase().includes(term)
            );
          }

          this.stages = filteredStages;
          this.stagesTotalRecords = response.totalRecords;

          this.stagesRows = event.rows;
          this.stagesFirst = event.first;

          this.calculateStats();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load stages', err);
        },
        complete: () => this.loadingStore.stop(),
      });
  }

  onStagesSearchChange(): void {
    this.stagesFirst = 0;
    this.loadStages({ first: 0, rows: this.stagesRows });
  }

  clearStagesSearch(): void {
    this.stagesSearchTerm = '';
    this.onStagesSearchChange();
  }

  viewStageDetails(stage: Stage): void {
    this.selectedStage = stage;
    this.displayStageDialog = true;
  }

  closeStageDialog(): void {
    this.displayStageDialog = false;
    this.selectedStage = null;
  }

  openInMaps(stage: Stage): void {
    const url = `https://www.google.com/maps/search/?api=1&query=${stage.latitude},${stage.longitude}`;
    window.open(url, '_blank');
  }

  // ================= STATS CALCULATION =================
  calculateStats(): void {

    this.statsCards = [
      {
        title: 'Total Stages',
        count: this.stagesTotalRecords,
        icon: 'pi-map-marker',
        color: '#ffc107',
        change: null,
      },
    ];
  }
}
