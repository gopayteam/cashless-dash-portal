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
import { Vehicle, VehicleFee } from '../../../../@core/models/vehicle/vehicle.model';
import { VehicleApiResponse } from '../../../../@core/models/vehicle/vehicle_reponse.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { ActionButtonComponent } from "../../../components/action-button/action-button";
import * as XLSX from 'xlsx';
import { MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';

interface StatusOption {
  label: string;
  value: string;
}

interface VehicleFeesApiResponse {
  status: number;
  message: string;
  data: VehicleFee[];
  totalRecords: number;
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
    ActionButtonComponent,
    MessageModule,
    ToastModule,
  ],
  templateUrl: './all.html',
  styleUrls: ['./all.css'],
  providers: [MessageService]
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
  selectedVehicleFees: VehicleFee[] = [];
  loadingFees: boolean = false;

  // Summary stats
  totalCapacity: number = 0;
  activeVehicles: number = 0;
  totalStages: number = 0;

  // Export state
  isExporting = false;

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
    private messageService: MessageService,
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
          this.cdr.detectChanges();
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
    this.loadVehicleFees(vehicle.fleetNumber);
    this.cdr.detectChanges();
  }

  loadVehicleFees(fleetNumber: string): void {
    if (!this.entityId || !fleetNumber) {
      console.error('Missing entityId or fleetNumber');
      return;
    }

    this.loadingFees = true;
    this.selectedVehicleFees = [];

    // Encode fleet number for URL (handle spaces)
    const encodedFleetNumber = encodeURIComponent(fleetNumber);

    const params = {
      entityId: this.entityId,
      fleetNumber: encodedFleetNumber
    };

    console.log('Fetching vehicle fees for:', fleetNumber);

    this.dataService
      .post<VehicleFeesApiResponse>(API_ENDPOINTS.VEHICLE_FEES, params, 'vehicle-fees')
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            this.selectedVehicleFees = response.data;
            console.log('✓ Vehicle fees loaded:', this.selectedVehicleFees);
          } else {
            console.log('⚠ No fees found for this vehicle');
            this.selectedVehicleFees = [];
          }
          this.loadingFees = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load vehicle fees:', err);
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Failed to load vehicle fees',
            life: 3000
          });
          this.loadingFees = false;
          this.selectedVehicleFees = [];
          this.cdr.detectChanges();
        }
      });
  }

  getFeeByNameAndDay(feeName: string, dayType: string = 'ALL'): VehicleFee | null {
    return this.selectedVehicleFees.find(
      fee => fee.feeName === feeName && fee.dayType === dayType
    ) || null;
  }

  getFeeAmount(feeName: string, dayType: string = 'ALL'): number {
    const fee = this.getFeeByNameAndDay(feeName, dayType);
    return fee?.feeAmount ?? 0;
  }

  getTotalFees(): number {
    return this.selectedVehicleFees.reduce((sum, fee) => sum + fee.feeAmount, 0);
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedVehicle = null;
    this.selectedVehicleFees = [];
    this.loadingFees = false;
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

    // Pass the complete vehicle object through router state
    this.router.navigate(['/forms/update-vehicle', vehicle.fleetNumber], {
      state: {
        vehicle: vehicle,
        timestamp: Date.now()
      }
    });
  }

  refreshVehicles(): void {
    if (this.lastEvent)
      this.fetchVehicles(true, this.lastEvent);
  }

  /**
  * Export vehicles to Excel
  */
  exportToExcel(): void {
    if (this.vehicles.length === 0) {
      console.warn('No vehicles to export');
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No vehicles to export',
        life: 3000
      });
      return;
    }

    try {
      this.isExporting = true;

      // Prepare data for export
      const exportData = this.vehicles.map(vehicle => ({
        'Fleet Number': vehicle.fleetNumber,
        'Fleet Code': vehicle.fleetCode,
        'Registration Number': vehicle.registrationNumber,
        'Stage': vehicle.stageName,
        'Status': vehicle.status,
        'Total Capacity': vehicle.capacity,
        'Seated Capacity': vehicle.seatedCapacity,
        'Standing Capacity': vehicle.standingCapacity,
        'Investor Number': vehicle.investorNumber,
        'Marshal Number': vehicle.marshalNumber,
        'Store Number': vehicle.storeNumber || 'N/A',
        'Till Number': vehicle.tillNumber || 'N/A',
        'OTP Approver': vehicle.otpApproverNumber || 'N/A',
        'Org Fees Maintained': vehicle.organizationFeesMaintained ? 'Yes' : 'No',
        'Entity Name': vehicle.entityName,
        'Created On': new Date(vehicle.createdOn).toLocaleString(),
        'Created By': vehicle.createBy,
        'Last Modified': vehicle.lastModifiedDate ? new Date(vehicle.lastModifiedDate).toLocaleString() : 'N/A',
        'Modified By': vehicle.modifiedBy || 'N/A'
      }));

      // Create worksheet
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Fleet Number
        { wch: 15 }, // Fleet Code
        { wch: 20 }, // Registration Number
        { wch: 20 }, // Stage
        { wch: 12 }, // Status
        { wch: 15 }, // Total Capacity
        { wch: 15 }, // Seated Capacity
        { wch: 18 }, // Standing Capacity
        { wch: 15 }, // Investor Number
        { wch: 15 }, // Marshal Number
        { wch: 15 }, // Store Number
        { wch: 15 }, // Till Number
        { wch: 15 }, // OTP Approver
        { wch: 20 }, // Org Fees Maintained
        { wch: 20 }, // Entity Name
        { wch: 20 }, // Created On
        { wch: 20 }, // Created By
        { wch: 20 }, // Last Modified
        { wch: 20 }  // Modified By
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vehicles');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `vehicles_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      console.log('Vehicles exported to Excel successfully');
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Vehicles exported to Excel successfully',
        life: 4000
      });
    } catch (error) {
      console.error('Failed to export to Excel:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export vehicles to Excel',
        life: 4000
      });
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * Export vehicles to CSV
   */
  exportToCSV(): void {
    if (this.vehicles.length === 0) {
      console.warn('No vehicles to export');
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No vehicles to export',
        life: 3000
      });
      return;
    }

    try {
      this.isExporting = true;

      // Prepare data for export
      const exportData = this.vehicles.map(vehicle => ({
        'Fleet Number': vehicle.fleetNumber,
        'Fleet Code': vehicle.fleetCode,
        'Registration Number': vehicle.registrationNumber,
        'Stage': vehicle.stageName,
        'Status': vehicle.status,
        'Total Capacity': vehicle.capacity,
        'Seated Capacity': vehicle.seatedCapacity,
        'Standing Capacity': vehicle.standingCapacity,
        'Investor Number': vehicle.investorNumber,
        'Marshal Number': vehicle.marshalNumber,
        'Store Number': vehicle.storeNumber || 'N/A',
        'Till Number': vehicle.tillNumber || 'N/A',
        'OTP Approver': vehicle.otpApproverNumber || 'N/A',
        'Org Fees Maintained': vehicle.organizationFeesMaintained ? 'Yes' : 'No',
        'Entity Name': vehicle.entityName,
        'Created On': new Date(vehicle.createdOn).toLocaleString(),
        'Created By': vehicle.createBy,
        'Last Modified': vehicle.lastModifiedDate ? new Date(vehicle.lastModifiedDate).toLocaleString() : 'N/A',
        'Modified By': vehicle.modifiedBy || 'N/A'
      }));

      // Create worksheet and convert to CSV
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `vehicles_${timestamp}.csv`;

      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);

      console.log('Vehicles exported to CSV successfully');
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Vehicles exported to CSV successfully',
        life: 4000
      });
    } catch (error) {
      console.error('Failed to export to CSV:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export vehicles to CSV',
        life: 4000
      });
    } finally {
      this.isExporting = false;
    }
  }
}
