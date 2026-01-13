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
import { MenuItem } from 'primeng/api';

import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { Stage } from '../../../../@core/models/locations/stage.model';
import { Route } from '../../../../@core/models/locations/route.model';
import { RoutesResponse } from '../../../../@core/models/locations/route_response.model';
import { StagesResponse } from '../../../../@core/models/locations/state_response.model';

@Component({
  standalone: true,
  selector: 'app-routes',
  templateUrl: './routes.html',
  styleUrls: ['./routes.css'],
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
export class LocationRoutesComponent implements OnInit {
  // Routes Data
  routes: Route[] = [];
  routesTotalRecords = 0;
  routesRows = 10;
  routesFirst = 0;
  routesSearchTerm = '';

  // Stats Cards
  statsCards: any[] = [];

  // Dialogs
  displayRouteDialog = false;
  selectedRoute: Route | null = null;

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private cdr: ChangeDetectorRef
  ) {}

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    this.loadRoutes({ first: 0, rows: this.routesRows });
  }

  // ================= ROUTES METHODS =================
  loadRoutes(event: any): void {
    this.loadingStore.start();

    const page = event.first / event.rows;

    // ✅ params instead of payload
    const params = {
      entityId: 'GS000002',
      page,
      size: event.rows,
    };

    this.dataService
      .get<RoutesResponse>(API_ENDPOINTS.ALL_ROUTES, params, 'routes')
      .subscribe({
        next: (response) => {
          let filteredRoutes = response.data;

          // Apply search filter (client-side)
          if (this.routesSearchTerm) {
            const term = this.routesSearchTerm.toLowerCase();
            filteredRoutes = filteredRoutes.filter(
              (r) =>
                r.startLocation.toLowerCase().includes(term) ||
                r.endLocation.toLowerCase().includes(term) ||
                r.direction.toLowerCase().includes(term)
            );
          }

          this.routes = filteredRoutes;
          this.routesTotalRecords = response.totalRecords;

          this.routesRows = event.rows;
          this.routesFirst = event.first;

          this.calculateStats();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load routes', err);
        },
        complete: () => this.loadingStore.stop(),
      });
  }


  onRoutesSearchChange(): void {
    this.routesFirst = 0;
    this.loadRoutes({ first: 0, rows: this.routesRows });
  }

  clearRoutesSearch(): void {
    this.routesSearchTerm = '';
    this.onRoutesSearchChange();
  }

  viewRouteDetails(route: Route): void {
    this.selectedRoute = route;
    this.displayRouteDialog = true;
  }

  closeRouteDialog(): void {
    this.displayRouteDialog = false;
    this.selectedRoute = null;
  }

  getDirectionClass(direction: string): string {
    return direction === 'FORWARD' ? 'badge-credit' : 'badge-debit';
  }

  // ================= STATS CALCULATION =================
  calculateStats(): void {
    const forwardRoutes = this.routes.filter((r) => r.direction === 'FORWARD').length;
    const reverseRoutes = this.routes.filter((r) => r.direction === 'REVERSE').length;

    this.statsCards = [
      {
        title: 'Total Routes',
        count: this.routesTotalRecords,
        icon: 'pi-map',
        color: '#667eea',
        change: null,
      },
      {
        title: 'Forward Routes',
        count: forwardRoutes,
        icon: 'pi-arrow-right',
        color: '#28a745',
        change: null,
      },
      {
        title: 'Reverse Routes',
        count: reverseRoutes,
        icon: 'pi-arrow-left',
        color: '#dc3545',
        change: null,
      },
    ];
  }
}
