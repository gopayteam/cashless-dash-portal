// pages/vehicles/all-vehicles.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { Vehicle } from '../../../../@core/models/vehicle/vehicle.model';
import { VehicleApiResponse } from '../../../../@core/models/vehicle/vehicle_reponse.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { ActionButtonComponent } from "../../../components/action-button/action-button";

interface StatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-all-vehicles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ActionButtonComponent
  ],
  templateUrl: './all.html',
  styleUrls: ['./all.css'],
})
export class AllVehiclesComponent implements OnInit {

  entityId: string | null = null;
  vehicles: Vehicle[] = [];
  allVehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];

  private lastEvent: any;

  // Pagination state
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  searchTerm: string = '';
  selectedStatus: string = '';

  // Dialog state
  displayDetailDialog: boolean = false;
  selectedVehicle: Vehicle | null = null;

  // Summary stats
  totalCapacity: number = 0;
  activeVehicles: number = 0;
  totalStages: number = 0;

  // Status filter options
  statusOptionsList: StatusOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Maintenance', value: 'MAINTENANCE' },
  ];

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

    this.loadVehicles();
  }

  loadVehicles($event?: any): void {
    this.lastEvent = event;
    this.fetchVehicles(false, $event);
  }

  fetchVehicles(bypassCache: boolean, $event?: any): void {
    const event = $event;

    // Handle pagination from PrimeNG lazy load event
    let page = 0;
    let pageSize = this.rows;

    if (event) {
      page = event.first / event.rows;
      pageSize = event.rows;
      this.first = event.first;
      this.rows = event.rows;
    }

    const payload = {
      entityId: this.entityId,
      page,
      size: pageSize,
    };

    this.loadingStore.start();

    this.dataService
      .post<VehicleApiResponse>(API_ENDPOINTS.ALL_VEHICLES, payload, 'vehicles', bypassCache)
      .subscribe({
        next: (response) => {
          this.allVehicles = response.data;
          this.totalRecords = response.totalRecords;
          this.calculateStats();
          this.applyClientSideFilter();
          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load vehicles', err);
          this.loadingStore.stop();
        },
      });
  }

  calculateStats(): void {
    this.totalCapacity = this.allVehicles.reduce((sum, vehicle) => sum + vehicle.capacity, 0);
    this.activeVehicles = this.allVehicles.filter(v => v.status === 'ACTIVE').length;

    // Count unique stages
    const uniqueStages = new Set(this.allVehicles.map(v => v.stageId));
    this.totalStages = uniqueStages.size;
  }

  applyClientSideFilter(): void {
    let filtered = [...this.allVehicles];

    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((vehicle) => {
        return (
          vehicle.fleetNumber?.toLowerCase().includes(searchLower) ||
          vehicle.registrationNumber?.toLowerCase().includes(searchLower) ||
          vehicle.fleetCode?.toLowerCase().includes(searchLower) ||
          vehicle.stageName?.toLowerCase().includes(searchLower) ||
          vehicle.investorNumber?.includes(searchLower) ||
          vehicle.marshalNumber?.includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (this.selectedStatus && this.selectedStatus !== '') {
      filtered = filtered.filter(vehicle => vehicle.status === this.selectedStatus);
    }

    this.filteredVehicles = filtered;
    this.vehicles = filtered;
  }

  onSearchChange(): void {
    this.applyClientSideFilter();
  }

  onStatusChange(): void {
    this.applyClientSideFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyClientSideFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.applyClientSideFilter();
  }

  viewVehicleDetails(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedVehicle = null;
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'active',
      'INACTIVE': 'inactive',
      'MAINTENANCE': 'warning',
    };
    return statusMap[status] || 'default';
  }

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'ACTIVE': 'pi-check-circle',
      'INACTIVE': 'pi-times-circle',
      'MAINTENANCE': 'pi-wrench',
    };
    return iconMap[status] || 'pi-circle';
  }

  navigateToAddVehicle(): void {
    this.router.navigate(['/forms/add-vehicle']);
  }

  navigateToUpdateVehicle(vehicle: Vehicle, event?: Event): void {
    event?.stopPropagation();

    if (!vehicle?.id) {
      console.error('Vehicle ID missing', vehicle);
      return;
    }

    // console.log('Navigating to update vehicle:', vehicle.id);
    // console.log('Vehicle data being passed:', vehicle);

    // Pass the complete user object through router state
    // This ensures the data is immediately available in the update component
    this.router.navigate(['/forms/update-vehicle', vehicle.id], {
      state: {
        vehicle: vehicle,
        // Add timestamp to ensure fresh state
        timestamp: Date.now()
      }
    });
  }

  refreshVehicles(): void {
    if (this.lastEvent)
      this.fetchVehicles(true, this.lastEvent);
  }
}
