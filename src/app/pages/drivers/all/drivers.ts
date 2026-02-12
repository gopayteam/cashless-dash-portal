// pages/drivers/drivers.component.ts
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
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Driver, DriverStatus } from '../../../../@core/models/drivers/driver.model';
import { DataService } from '../../../../@core/api/data.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { DriveApiResponse } from '../../../../@core/models/drivers/driver_response.model';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { Router } from '@angular/router';
import { AuthService } from '../../../../@core/services/auth.service';


@Component({
  standalone: true,
  selector: 'app-drivers',
  templateUrl: './drivers.html',
  styleUrls: [
    './drivers.css',
    '../../../../styles/modules/_cards.css',
    '../../../../styles/modules/_filter_actions.css'
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
    MatSelectModule,
    MatFormFieldModule,
  ],
})
export class AllDriversComponent implements OnInit {
  entityId: string | null = null;
  drivers: Driver[] = [];

  // Pagination
  totalRecords = 0;
  rows = 10;
  first = 0;

  // Stats Cards
  statsCards: any[] = [];

  // Filters
  filters = {
    status: null as DriverStatus | null,
    fleetNumber: '',
  };

  // Search
  searchTerm = '';

  // Dialog
  displayDetailDialog = false;
  selectedDriver: Driver | null = null;

  // Dropdown options
  driverStatuses: DriverStatus[] = ['ACTIVE', 'INACTIVE'];

  private lastEvent: any;

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

    this.loadDrivers({ first: 0, rows: this.rows });
  }

  loadDrivers(event: any): void {
    this.lastEvent = event;
    this.loadingStore.start();

    const page = event.first / event.rows;

    const payload = {
      entityId: this.entityId,
      page,
      size: event.rows,
    };

    this.dataService
      .post<DriveApiResponse>(API_ENDPOINTS.ALL_DRIVERS, payload, 'drivers')
      .subscribe({
        next: (response) => {
          // Apply client-side filtering if needed
          let filteredDrivers = response.data;

          // Filter by status
          if (this.filters.status) {
            filteredDrivers = filteredDrivers.filter(
              (d) => d.status === this.filters.status
            );
          }

          // Filter by fleet number
          if (this.filters.fleetNumber) {
            filteredDrivers = filteredDrivers.filter((d) =>
              d.fleetNumber
                .toLowerCase()
                .includes(this.filters.fleetNumber.toLowerCase())
            );
          }

          // Filter by search term
          if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filteredDrivers = filteredDrivers.filter(
              (d) =>
                d.firstName.toLowerCase().includes(term) ||
                d.lastName.toLowerCase().includes(term) ||
                d.phoneNumber.includes(term) ||
                d.username.toLowerCase().includes(term) ||
                d.fleetNumber.toLowerCase().includes(term)
            );
          }

          this.drivers = filteredDrivers;
          this.totalRecords = response.totalRecords;

          // Calculate stats
          this.calculateStats(response.data);

          this.rows = event.rows;
          this.first = event.first;

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load drivers', err);
        },
        complete: () => this.loadingStore.stop(),
      });
  }

  refreshDrivers(): void {
    const event = this.lastEvent || { first: 0, rows: this.rows };
    this.loadDrivers(event);
  }


  calculateStats(drivers: Driver[]): void {
    const activeDrivers = drivers.filter((d) => d.status === 'ACTIVE').length;
    const inactiveDrivers = drivers.filter((d) => d.status === 'INACTIVE').length;
    const totalDrivers = drivers.length;

    // Count unique fleet numbers
    const uniqueFleets = new Set(drivers.map((d) => d.fleetNumber)).size;

    this.statsCards = [
      {
        title: 'Total Drivers',
        count: this.totalRecords,
        icon: 'pi-users',
        color: '#667eea',
        change: null,
      },
      {
        title: 'Active Drivers',
        count: activeDrivers,
        icon: 'pi-check-circle',
        color: '#28a745',
        change: null,
      },
      {
        title: 'Inactive Drivers',
        count: inactiveDrivers,
        icon: 'pi-times-circle',
        color: '#dc3545',
        change: null,
      },
      {
        title: 'Assigned Fleets',
        count: uniqueFleets,
        icon: 'pi-car',
        color: '#ffc107',
        change: null,
      },
    ];
  }

  applyFilters(): void {
    this.first = 0;
    this.loadDrivers({ first: 0, rows: this.rows });
  }

  resetFilters(): void {
    this.filters = {
      status: null,
      fleetNumber: '',
    };
    this.searchTerm = '';
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  viewDriverDetails(driver: Driver): void {
    this.selectedDriver = driver;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    // this.selectedDriver = null;
  }

  getStatusClass(status: DriverStatus): string {
    return status === 'ACTIVE' ? 'badge-paid' : 'badge-failed';
  }

  isDriverActive(driver: Driver): boolean {
    if (driver.status === 'INACTIVE') return false;

    const today = new Date();
    const startDate = new Date(driver.startDate);
    const endDate = new Date(driver.endDate);

    return today >= startDate && today <= endDate;
  }

  getDriverFullName(driver: Driver): string {
    return `${driver.firstName} ${driver.lastName}`;
  }

  getDaysRemaining(driver: Driver): number {
    const today = new Date();
    const endDate = new Date(driver.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }
}
