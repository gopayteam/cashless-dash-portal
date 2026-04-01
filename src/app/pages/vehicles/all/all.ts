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
import { formatDateLocal } from '../../../../@core/utils/date-time.util';
import { VehicleAnalysisModalComponent } from '../../../components/vehicle-analysis/vehicle-analysis-modal/vehicle-analysis-modal';

import { QRCodeComponent } from 'angularx-qrcode';
import { SafeUrl } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment.prod';
// import { environment } from '../../../../environments/environment';

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
    VehicleAnalysisModalComponent,
    QRCodeComponent,
  ],
  templateUrl: './all.html',
  styleUrls: ['./all.css', '../../../../styles/global/_toast.css'],
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

  displayAnalysisModal = false;
  selectedVehicleForAnalysis: Vehicle | null = null;
  window: any;


  // Add this method:
  openAnalysisModal(vehicle: Vehicle, event?: MouseEvent): void {
    event?.stopPropagation();
    this.selectedVehicleForAnalysis = vehicle;
    this.displayAnalysisModal = true;
  }

  closeAnalysisModal(): void {
    this.displayAnalysisModal = false;
  }

  // Add these new state variables
  displayQrDialog: boolean = false;
  qrCodeData: string = '';
  selectedVehicleForQr: Vehicle | null = null;

  // Method to open QR Dialog and build the URL
  openQrModal(vehicle: Vehicle, event?: MouseEvent): void {
    event?.stopPropagation();
    this.selectedVehicleForQr = vehicle;

    const prodUrl = 'https://passenger.gopay.ke/fare/payment-request';
    const devUrl = 'http://localhost:4200/fare/payment-request';

    // Use the environment variable here
    const baseUrl = `${environment.dashboardBaseUrl}/fare/payment-request`;

    this.qrCodeData = `${baseUrl}?fleetNumber=${vehicle.fleetNumber}&entityId=${vehicle.entityId}`;

    this.displayQrDialog = true;
  }

  // Method to download the QR code as an image for printing
  // downloadQrCode() {
  //   const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  //   if (canvas) {
  //     const link = document.createElement('a');
  //     link.download = `QR_${this.selectedVehicleForQr?.fleetNumber}.png`;
  //     link.href = canvas.toDataURL('image/png', 1.0); // High quality
  //     link.click();
  //   }
  // }

  downloadQrCode(): void {
    const qrCanvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!qrCanvas) return;

    const vehicle = this.selectedVehicleForQr;
    const fleetNumber = vehicle?.fleetNumber ?? 'Unknown Fleet';
    const regNumber = vehicle?.registrationNumber ?? 'Unknown Reg';
    const entityId = vehicle?.entityId ?? '';

    // ── Brand config per entity ──────────────────────────────────────────
    interface BrandConfig {
      headerGradientStart: string;
      headerGradientEnd: string;
      accentColor: string;
      footerType: 'image' | 'text';
      footerImagePath?: string;
      footerText?: string;
      footerTextPrimary?: string;
      footerTextSecondary?: string;
    }

    const brandConfig: BrandConfig = (() => {
      switch (entityId) {
        case 'GS000002': // Super Metro
          return {
            headerGradientStart: '#F47B20',
            headerGradientEnd: '#2E3192',
            accentColor: '#F47B20',
            footerType: 'image',
            footerImagePath: '/super_metro_logo.png',
          };

        case 'GS000006': // Bungoma Line
          return {
            headerGradientStart: '#1B5E20', // orange from their branding
            headerGradientEnd: '#EF6C00',   // dark brown from their branding
            accentColor: '#FB8C00',
            footerType: 'text',
            footerTextPrimary: 'Bungoma Line',
            footerTextSecondary: 'Shuttle',
            footerTextPrimaryColor: '#1B5E20',
            footerTextSecondaryColor: '#EF6C00',
          } as any;

        default: // GoPay fallback
          return {
            headerGradientStart: '#1E88E5',
            headerGradientEnd: '#0D47A1',
            accentColor: '#1E88E5',
            footerType: 'image',
            footerImagePath: '/gopay_clear.png',
          };
      }
    })();

    // ── Canvas dimensions ─────────────────────────────────────────────────
    const padding = 24;
    const headerHeight = 80;
    const footerHeight = 90;
    const totalWidth = qrCanvas.width + padding * 2;
    const totalHeight = qrCanvas.height + headerHeight + footerHeight + padding * 2;

    const offscreen = document.createElement('canvas');
    offscreen.width = totalWidth;
    offscreen.height = totalHeight;
    const ctx = offscreen.getContext('2d')!;

    // ── Draw function (called directly or after image load) ───────────────
    const drawAndDownload = (logoImage?: HTMLImageElement) => {

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      // Header gradient with rounded top corners
      const radius = 12;
      const headerGradient = ctx.createLinearGradient(0, 0, totalWidth, headerHeight);
      headerGradient.addColorStop(0, brandConfig.headerGradientStart);
      headerGradient.addColorStop(1, brandConfig.headerGradientEnd);
      ctx.fillStyle = headerGradient;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(totalWidth - radius, 0);
      ctx.quadraticCurveTo(totalWidth, 0, totalWidth, radius);
      ctx.lineTo(totalWidth, headerHeight);
      ctx.lineTo(0, headerHeight);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.fill();

      // Header: Fleet Number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fleetNumber, totalWidth / 2, headerHeight * 0.42);

      // Header: Registration / Plate Number
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillText(regNumber, totalWidth / 2, headerHeight * 0.75);

      // QR Code
      ctx.drawImage(qrCanvas, padding, headerHeight + padding);

      // Thin accent divider above footer
      const qrBottom = headerHeight + padding + qrCanvas.height;
      ctx.fillStyle = brandConfig.accentColor;
      ctx.fillRect(0, qrBottom + 8, totalWidth, 3);

      // ── Footer ────────────────────────────────────────────────────────
      if (brandConfig.footerType === 'image' && logoImage) {
        // Image logo (Super Metro or GoPay)
        const maxLogoWidth = 180;
        const scale = Math.min(
          maxLogoWidth / logoImage.naturalWidth,
          (footerHeight - 24) / logoImage.naturalHeight
        );
        const logoW = logoImage.naturalWidth * scale;
        const logoH = logoImage.naturalHeight * scale;
        const logoX = (totalWidth - logoW) / 2;
        const logoY = qrBottom + 18;
        ctx.drawImage(logoImage, logoX, logoY, logoW, logoH);

      } else if (brandConfig.footerType === 'text') {
        // Styled text logo (Bungoma Line)
        const config = brandConfig as any;
        const centerX = totalWidth / 2;
        const baseY = qrBottom + 44;

        // "Bungoma Line" in bold orange
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = config.footerTextPrimaryColor ?? '#E87722';

        // Measure each word to color them individually
        const primaryWord = 'Bungoma';
        const secondaryWord = 'Line';
        const spacer = ' ';

        const primaryWidth = ctx.measureText(primaryWord).width;
        const spacerWidth = ctx.measureText(spacer).width;
        const secondaryWidth = ctx.measureText(secondaryWord).width;
        const totalTextWidth = primaryWidth + spacerWidth + secondaryWidth;

        let startX = centerX - totalTextWidth / 2;

        // "Bungoma" — orange
        ctx.textAlign = 'left';
        ctx.fillStyle = config.footerTextPrimaryColor ?? '#EF6C00';
        ctx.fillText(primaryWord, startX, baseY);
        startX += primaryWidth + spacerWidth;

        // "Line" — dark brown
        ctx.fillStyle = config.footerTextSecondaryColor ?? '#2E7D32';
        ctx.fillText(secondaryWord, startX, baseY);

        // "Shuttle" subtitle
        ctx.font = '14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = config.footerTextSecondaryColor ?? '#1B5E20';
        ctx.fillText('Shuttle', centerX, baseY + 22);
      }

      // Bottom accent bar
      const accentGradient = ctx.createLinearGradient(0, 0, totalWidth, 0);
      accentGradient.addColorStop(0, brandConfig.headerGradientStart);
      accentGradient.addColorStop(1, brandConfig.headerGradientEnd);
      ctx.fillStyle = accentGradient;
      ctx.fillRect(0, totalHeight - 6, totalWidth, 6);

      // Trigger download
      const link = document.createElement('a');
      link.download = `QR_${fleetNumber}_${regNumber}.png`;
      link.href = offscreen.toDataURL('image/png', 1.0);
      link.click();
    };

    // ── Load logo image or draw directly ──────────────────────────────────
    if (brandConfig.footerType === 'image' && brandConfig.footerImagePath) {
      const logo = new Image();
      logo.src = brandConfig.footerImagePath;
      logo.onload = () => drawAndDownload(logo);
      logo.onerror = () => {
        console.warn(`Logo failed to load (${brandConfig.footerImagePath}), downloading without logo.`);
        drawAndDownload();
      };
    } else {
      // Text footer — draw immediately, no image loading needed
      drawAndDownload();
    }
  }

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events.subscribe(() => {
      this.loadVehicles();
    });
  }

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
    this.lastEvent = $event;
    this.fetchVehicles(false, $event);
  }

  fetchVehicles(bypassCache: boolean, $event?: any): void {
    const event = $event || { first: 0, rows: this.rows };
    let page = event.first / event.rows;
    let pageSize = event.rows;

    this.first = event.first;
    this.rows = event.rows;

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
        },
        error: (err) => {
          console.error('Failed to load vehicles', err);
          this.cdr.detectChanges();
        },
        complete: () => this.loadingStore.stop(),
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
      .post<VehicleFeesApiResponse>(API_ENDPOINTS.VEHICLE_FEES, params, 'vehicle-fees', true)
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
    const event = this.lastEvent || { first: 0, rows: this.rows };
    this.fetchVehicles(true, event);
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
      const timestamp = formatDateLocal(new Date());
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
      const timestamp = formatDateLocal(new Date());
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
