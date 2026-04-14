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
import jsPDF from 'jspdf';
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
      const radius = 0;
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

  private buildBrandedQrCanvas22(): Promise<HTMLCanvasElement | null> {
    return new Promise((resolve) => {
      const qrCanvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!qrCanvas) { resolve(null); return; }

      const vehicle = this.selectedVehicleForQr;
      const fleetNumber = vehicle?.fleetNumber ?? 'Unknown Fleet';
      const regNumber = vehicle?.registrationNumber ?? 'Unknown Reg';
      const entityId = vehicle?.entityId ?? '';

      interface BrandConfig {
        headerGradientStart: string;
        headerGradientEnd: string;
        accentColor: string;
        footerType: 'image' | 'text';
        footerImagePath?: string;
        footerTextPrimary?: string;
        footerTextSecondary?: string;
        footerTextPrimaryColor?: string;
        footerTextSecondaryColor?: string;
      }

      const brandConfig: BrandConfig = (() => {
        switch (entityId) {
          case 'GS000002':
            return {
              headerGradientStart: '#F47B20', headerGradientEnd: '#2E3192',
              accentColor: '#F47B20', footerType: 'image', footerImagePath: '/super_metro_logo.png',
            };
          case 'GS000006':
            return {
              headerGradientStart: '#1B5E20', headerGradientEnd: '#EF6C00',
              accentColor: '#FB8C00', footerType: 'text',
              footerTextPrimary: 'Bungoma', footerTextSecondary: 'Line',
              footerTextPrimaryColor: '#EF6C00', footerTextSecondaryColor: '#2E7D32',
            };
          default:
            return {
              headerGradientStart: '#1E88E5', headerGradientEnd: '#0D47A1',
              accentColor: '#1E88E5', footerType: 'image', footerImagePath: '/gopay_clear.png',
            };
        }
      })();

      const padding = 24;
      const headerHeight = 80;
      const footerHeight = 90;
      const totalWidth = qrCanvas.width + padding * 2;
      const totalHeight = qrCanvas.height + headerHeight + footerHeight + padding * 2;

      const offscreen = document.createElement('canvas');
      offscreen.width = totalWidth;
      offscreen.height = totalHeight;
      const ctx = offscreen.getContext('2d')!;

      const draw = (logoImage?: HTMLImageElement) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        const headerGradient = ctx.createLinearGradient(0, 0, totalWidth, headerHeight);
        headerGradient.addColorStop(0, brandConfig.headerGradientStart);
        headerGradient.addColorStop(1, brandConfig.headerGradientEnd);
        ctx.fillStyle = headerGradient;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(totalWidth, 0);
        ctx.lineTo(totalWidth, headerHeight); ctx.lineTo(0, headerHeight);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(fleetNumber, totalWidth / 2, headerHeight * 0.42);
        ctx.font = '16px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.fillText(regNumber, totalWidth / 2, headerHeight * 0.75);

        ctx.drawImage(qrCanvas, padding, headerHeight + padding);

        const qrBottom = headerHeight + padding + qrCanvas.height;
        ctx.fillStyle = brandConfig.accentColor;
        ctx.fillRect(0, qrBottom + 8, totalWidth, 3);

        if (brandConfig.footerType === 'image' && logoImage) {
          const maxLogoWidth = 180;
          const scale = Math.min(maxLogoWidth / logoImage.naturalWidth, (footerHeight - 24) / logoImage.naturalHeight);
          const logoW = logoImage.naturalWidth * scale;
          const logoH = logoImage.naturalHeight * scale;
          ctx.drawImage(logoImage, (totalWidth - logoW) / 2, qrBottom + 18, logoW, logoH);
        } else if (brandConfig.footerType === 'text') {
          const centerX = totalWidth / 2;
          const baseY = qrBottom + 44;
          ctx.font = 'bold 26px Arial, sans-serif';
          const primaryWidth = ctx.measureText(brandConfig.footerTextPrimary!).width;
          const spacerWidth = ctx.measureText(' ').width;
          let startX = centerX - (primaryWidth + spacerWidth + ctx.measureText(brandConfig.footerTextSecondary!).width) / 2;
          ctx.textAlign = 'left';
          ctx.fillStyle = brandConfig.footerTextPrimaryColor!;
          ctx.fillText(brandConfig.footerTextPrimary!, startX, baseY);
          startX += primaryWidth + spacerWidth;
          ctx.fillStyle = brandConfig.footerTextSecondaryColor!;
          ctx.fillText(brandConfig.footerTextSecondary!, startX, baseY);
          ctx.font = '14px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = brandConfig.footerTextSecondaryColor!;
          ctx.fillText('Shuttle', centerX, baseY + 22);
        }

        const accentGradient = ctx.createLinearGradient(0, 0, totalWidth, 0);
        accentGradient.addColorStop(0, brandConfig.headerGradientStart);
        accentGradient.addColorStop(1, brandConfig.headerGradientEnd);
        ctx.fillStyle = accentGradient;
        ctx.fillRect(0, totalHeight - 6, totalWidth, 6);

        resolve(offscreen);
      };

      if (brandConfig.footerType === 'image' && brandConfig.footerImagePath) {
        const logo = new Image();
        logo.src = brandConfig.footerImagePath;
        logo.onload = () => draw(logo);
        logo.onerror = () => draw();
      } else {
        draw();
      }
    });
  }

  private buildBrandedQrCanvas23(): Promise<HTMLCanvasElement | null> {
    return new Promise((resolve) => {
      const qrCanvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!qrCanvas) { resolve(null); return; }

      const vehicle = this.selectedVehicleForQr;
      const fleetNumber = vehicle?.fleetNumber ?? 'Unknown Fleet';
      const regNumber = vehicle?.registrationNumber ?? 'Unknown Reg';
      const entityId = vehicle?.entityId ?? '';

      interface BrandConfig {
        headerGradientStart: string;
        headerGradientEnd: string;
        accentColor: string;
        footerType: 'image' | 'text';
        footerImagePath?: string;
        footerTextPrimary?: string;
        footerTextSecondary?: string;
        footerTextPrimaryColor?: string;
        footerTextSecondaryColor?: string;
      }

      const brandConfig: BrandConfig = (() => {
        switch (entityId) {
          case 'GS000002':
            return {
              headerGradientStart: '#F47B20', headerGradientEnd: '#2E3192',
              accentColor: '#F47B20', footerType: 'image', footerImagePath: '/super_metro_logo.png',
            };
          case 'GS000006':
            return {
              headerGradientStart: '#1B5E20', headerGradientEnd: '#EF6C00',
              accentColor: '#FB8C00', footerType: 'text',
              footerTextPrimary: 'Bungoma', footerTextSecondary: 'Line',
              footerTextPrimaryColor: '#EF6C00', footerTextSecondaryColor: '#2E7D32',
            };
          default:
            return {
              headerGradientStart: '#1E88E5', headerGradientEnd: '#0D47A1',
              accentColor: '#1E88E5', footerType: 'image', footerImagePath: '/gopay_clear.png',
            };
        }
      })();

      const padding = 24;
      const textTopPadding = 12;
      const headerHeight = 80;
      const footerHeight = 90;
      const scanTextHeight = 36; // ✅ space reserved for "Scan to Pay"
      const totalWidth = qrCanvas.width + padding * 2;
      const totalHeight = qrCanvas.height + headerHeight + footerHeight + padding * 2 + scanTextHeight; // ✅ added

      const offscreen = document.createElement('canvas');
      offscreen.width = totalWidth;
      offscreen.height = totalHeight;
      const ctx = offscreen.getContext('2d')!;

      const draw = (logoImage?: HTMLImageElement) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // Header gradient
        const headerGradient = ctx.createLinearGradient(0, 0, totalWidth, headerHeight);
        headerGradient.addColorStop(0, brandConfig.headerGradientStart);
        headerGradient.addColorStop(1, brandConfig.headerGradientEnd);
        ctx.fillStyle = headerGradient;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(totalWidth, 0);
        ctx.lineTo(totalWidth, headerHeight); ctx.lineTo(0, headerHeight);
        ctx.closePath();
        ctx.fill();

        // Fleet + reg text in header
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(fleetNumber, totalWidth / 2, headerHeight * 0.42);
        ctx.font = '16px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.fillText(regNumber, totalWidth / 2, headerHeight * 0.75);

        // QR code
        ctx.drawImage(qrCanvas, padding, headerHeight + padding);

        const qrBottom = headerHeight + padding + qrCanvas.height;

        // ✅ "Scan to Pay" text — centered between QR bottom and accent line
        ctx.font = 'bold 35px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = brandConfig.accentColor;
        ctx.fillText('SCAN TO PAY', totalWidth / 2, qrBottom + (scanTextHeight / 2) + 4 + textTopPadding);

        // Accent line — now pushed down by scanTextHeight
        ctx.fillStyle = brandConfig.accentColor;
        ctx.fillRect(0, qrBottom + scanTextHeight + 8 + textTopPadding, totalWidth, 3);

        const accentLineBottom = qrBottom + scanTextHeight + 8 + textTopPadding;

        // Footer — logo or branded text
        if (brandConfig.footerType === 'image' && logoImage) {
          const maxLogoWidth = 180;
          const scale = Math.min(maxLogoWidth / logoImage.naturalWidth, (footerHeight - 24) / logoImage.naturalHeight);
          const logoW = logoImage.naturalWidth * scale;
          const logoH = logoImage.naturalHeight * scale;
          ctx.drawImage(logoImage, (totalWidth - logoW) / 2, accentLineBottom + 18, logoW, logoH);
        } else if (brandConfig.footerType === 'text') {
          const centerX = totalWidth / 2;
          const baseY = accentLineBottom + 44;
          ctx.font = 'bold 26px Arial, sans-serif';
          ctx.textAlign = 'left';
          const primaryWidth = ctx.measureText(brandConfig.footerTextPrimary!).width;
          const spacerWidth = ctx.measureText(' ').width;
          const secondaryWidth = ctx.measureText(brandConfig.footerTextSecondary!).width;
          let startX = centerX - (primaryWidth + spacerWidth + secondaryWidth) / 2;
          ctx.fillStyle = brandConfig.footerTextPrimaryColor!;
          ctx.fillText(brandConfig.footerTextPrimary!, startX, baseY);
          startX += primaryWidth + spacerWidth;
          ctx.fillStyle = brandConfig.footerTextSecondaryColor!;
          ctx.fillText(brandConfig.footerTextSecondary!, startX, baseY);
          ctx.font = '14px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = brandConfig.footerTextSecondaryColor!;
          ctx.fillText('Shuttle', centerX, baseY + 22);
        }

        // Bottom accent bar
        const accentGradient = ctx.createLinearGradient(0, 0, totalWidth, 0);
        accentGradient.addColorStop(0, brandConfig.headerGradientStart);
        accentGradient.addColorStop(1, brandConfig.headerGradientEnd);
        ctx.fillStyle = accentGradient;
        ctx.fillRect(0, totalHeight - 6, totalWidth, 6);

        resolve(offscreen);
      };

      if (brandConfig.footerType === 'image' && brandConfig.footerImagePath) {
        const logo = new Image();
        logo.src = brandConfig.footerImagePath;
        logo.onload = () => draw(logo);
        logo.onerror = () => draw();
      } else {
        draw();
      }
    });
  }

  private buildBrandedQrCanvas24(): Promise<HTMLCanvasElement | null> {
    return new Promise((resolve) => {
      const qrCanvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!qrCanvas) { resolve(null); return; }

      const vehicle = this.selectedVehicleForQr;
      const fleetNumber = vehicle?.fleetNumber ?? 'Unknown Fleet';
      const regNumber = vehicle?.registrationNumber ?? 'Unknown Reg';
      const entityId = vehicle?.entityId ?? '';

      // ── Print dimensions ────────────────────────────────────────
      // Target: 5cm wide × 8cm tall at 300 DPI
      const DPI = 300;
      const CM_TO_INCH = 1 / 2.54;
      const totalWidth = Math.round(5 * CM_TO_INCH * DPI);  // ≈ 591 px
      const totalHeight = Math.round(8 * CM_TO_INCH * DPI);  // ≈ 945 px

      // ── Proportional layout (all values relative to totalHeight) ─
      const headerHeight = Math.round(totalHeight * 0.12);  // ~12% → header
      const footerHeight = Math.round(totalHeight * 0.12);  // ~12% → footer
      const scanTextHeight = Math.round(totalHeight * 0.06);  // ~6%  → "SCAN TO PAY"
      const accentBarH = Math.round(totalHeight * 0.007); // ~0.7% → accent lines
      const padding = Math.round(totalWidth * 0.05);  // ~5%  → side padding
      const textTopPadding = Math.round(totalHeight * 0.012); // small nudge

      // QR code fills the remaining vertical space
      const qrSize = totalHeight
        - headerHeight
        - footerHeight
        - scanTextHeight
        - accentBarH * 2   // top accent line + bottom bar
        - padding * 2;     // top + bottom padding around QR

      // ── Font sizes (proportional to totalWidth) ──────────────────
      const fontFleet = Math.round(totalWidth * 0.075);  // fleet number
      const fontReg = Math.round(totalWidth * 0.054);  // reg number
      const fontScanText = Math.round(totalWidth * 0.09);   // SCAN TO PAY
      const fontFooter1 = Math.round(totalWidth * 0.082);  // footer primary text
      const fontFooter2 = Math.round(totalWidth * 0.044);  // footer secondary text

      interface BrandConfig {
        headerGradientStart: string;
        headerGradientEnd: string;
        accentColor: string;
        footerType: 'image' | 'text';
        footerImagePath?: string;
        footerTextPrimary?: string;
        footerTextSecondary?: string;
        footerTextPrimaryColor?: string;
        footerTextSecondaryColor?: string;
      }

      const brandConfig: BrandConfig = (() => {
        switch (entityId) {
          case 'GS000002':
            return {
              headerGradientStart: '#F47B20', headerGradientEnd: '#2E3192',
              accentColor: '#F47B20', footerType: 'image',
              footerImagePath: '/super_metro_logo.png',
            };
          case 'GS000006':
            return {
              headerGradientStart: '#1B5E20', headerGradientEnd: '#EF6C00',
              accentColor: '#FB8C00', footerType: 'text',
              footerTextPrimary: 'Bungoma', footerTextSecondary: 'Line',
              footerTextPrimaryColor: '#EF6C00', footerTextSecondaryColor: '#2E7D32',
            };
          default:
            return {
              headerGradientStart: '#1E88E5', headerGradientEnd: '#0D47A1',
              accentColor: '#1E88E5', footerType: 'image',
              footerImagePath: '/gopay_clear.png',
            };
        }
      })();

      const offscreen = document.createElement('canvas');
      offscreen.width = totalWidth;
      offscreen.height = totalHeight;
      const ctx = offscreen.getContext('2d')!;

      // Enable high-quality image smoothing for the scaled QR
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const draw = (logoImage?: HTMLImageElement) => {
        // ── Background ─────────────────────────────────────────────
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // ── Header gradient ────────────────────────────────────────
        const headerGradient = ctx.createLinearGradient(0, 0, totalWidth, headerHeight);
        headerGradient.addColorStop(0, brandConfig.headerGradientStart);
        headerGradient.addColorStop(1, brandConfig.headerGradientEnd);
        ctx.fillStyle = headerGradient;
        ctx.fillRect(0, 0, totalWidth, headerHeight);

        // Fleet number
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontFleet}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(fleetNumber, totalWidth / 2, headerHeight * 0.44);

        // Reg number
        ctx.font = `${fontReg}px Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.fillText(regNumber, totalWidth / 2, headerHeight * 0.78);

        // ── QR code — scaled to qrSize × qrSize ───────────────────
        const qrX = (totalWidth - qrSize) / 2;   // horizontally centred
        const qrY = headerHeight + padding;
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

        const qrBottom = qrY + qrSize;

        // ── "SCAN TO PAY" text ─────────────────────────────────────
        const scanTextY = qrBottom + scanTextHeight * 0.6 + textTopPadding;
        ctx.font = `bold ${fontScanText}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = brandConfig.accentColor;
        ctx.fillText('SCAN TO PAY', totalWidth / 2, scanTextY);

        // ── Accent separator line ──────────────────────────────────
        const accentLineY = qrBottom + scanTextHeight + textTopPadding;
        ctx.fillStyle = brandConfig.accentColor;
        ctx.fillRect(0, accentLineY, totalWidth, accentBarH);

        // ── Footer ─────────────────────────────────────────────────
        const footerStartY = accentLineY + accentBarH;
        const footerCentreY = footerStartY + footerHeight / 2;

        if (brandConfig.footerType === 'image' && logoImage) {
          const maxLogoW = totalWidth * 0.72;
          const maxLogoH = footerHeight * 0.72;
          const scale = Math.min(maxLogoW / logoImage.naturalWidth, maxLogoH / logoImage.naturalHeight);
          const logoW = logoImage.naturalWidth * scale;
          const logoH = logoImage.naturalHeight * scale;
          ctx.drawImage(
            logoImage,
            (totalWidth - logoW) / 2,
            footerCentreY - logoH / 2,
            logoW, logoH
          );
        } else if (brandConfig.footerType === 'text') {
          ctx.font = `bold ${fontFooter1}px Arial, sans-serif`;
          ctx.textAlign = 'left';
          const primaryW = ctx.measureText(brandConfig.footerTextPrimary!).width;
          const spaceW = ctx.measureText(' ').width;
          const secondaryW = ctx.measureText(brandConfig.footerTextSecondary!).width;
          let startX = (totalWidth - (primaryW + spaceW + secondaryW)) / 2;

          ctx.fillStyle = brandConfig.footerTextPrimaryColor!;
          ctx.fillText(brandConfig.footerTextPrimary!, startX, footerCentreY);
          startX += primaryW + spaceW;
          ctx.fillStyle = brandConfig.footerTextSecondaryColor!;
          ctx.fillText(brandConfig.footerTextSecondary!, startX, footerCentreY);

          ctx.font = `${fontFooter2}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = brandConfig.footerTextSecondaryColor!;
          ctx.fillText('Shuttle', totalWidth / 2, footerCentreY + fontFooter1 * 0.75);
        }

        // ── Bottom accent bar ──────────────────────────────────────
        const bottomGradient = ctx.createLinearGradient(0, 0, totalWidth, 0);
        bottomGradient.addColorStop(0, brandConfig.headerGradientStart);
        bottomGradient.addColorStop(1, brandConfig.headerGradientEnd);
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(0, totalHeight - accentBarH * 2, totalWidth, accentBarH * 2);

        resolve(offscreen);
      };

      if (brandConfig.footerType === 'image' && brandConfig.footerImagePath) {
        const logo = new Image();
        logo.src = brandConfig.footerImagePath;
        logo.onload = () => draw(logo);
        logo.onerror = () => draw();
      } else {
        draw();
      }
    });
  }

  private buildBrandedQrCanvas(): Promise<HTMLCanvasElement | null> {
    return new Promise((resolve) => {
      const qrCanvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!qrCanvas) { resolve(null); return; }

      const vehicle = this.selectedVehicleForQr;
      const fleetNumber = vehicle?.fleetNumber ?? 'Unknown Fleet';
      const regNumber = vehicle?.registrationNumber ?? 'Unknown Reg';
      const entityId = vehicle?.entityId ?? '';

      // ── Print dimensions: exactly 5cm × 8cm @ 300 DPI ────────────
      const DPI = 300;
      const CM_TO_INCH = 1 / 2.54;
      const totalWidth = Math.round(5 * CM_TO_INCH * DPI);   // 591 px
      const totalHeight = Math.round(8 * CM_TO_INCH * DPI);   // 945 px

      // ── Strict proportional budget (all from totalHeight) ─────────
      const headerHeight = Math.round(totalHeight * 0.12);  // 12%
      const footerHeight = Math.round(totalHeight * 0.12);  // 12%
      const scanTextHeight = Math.round(totalHeight * 0.07);  // 7%
      const accentBarH = Math.round(totalHeight * 0.008); // 0.8% each × 2 = 1.6%
      const qrPadding = Math.round(totalHeight * 0.03);  // 3% gap above/below QR

      // QR gets exactly what's left — no overflow, no gap
      const qrSize = totalHeight
        - headerHeight
        - footerHeight
        - scanTextHeight
        - accentBarH * 2   // top accent + bottom bar
        - qrPadding * 2;  // space above and below the QR

      // ── Font sizes (proportional to totalWidth) ───────────────────
      const fontFleet = Math.round(totalWidth * 0.075);
      const fontReg = Math.round(totalWidth * 0.054);
      const fontScanText = Math.round(totalWidth * 0.09);
      const fontFooter1 = Math.round(totalWidth * 0.082);
      const fontFooter2 = Math.round(totalWidth * 0.044);

      interface BrandConfig {
        headerGradientStart: string;
        headerGradientEnd: string;
        accentColor: string;
        footerType: 'image' | 'text';
        footerImagePath?: string;
        footerTextPrimary?: string;
        footerTextSecondary?: string;
        footerTextPrimaryColor?: string;
        footerTextSecondaryColor?: string;
      }

      const brandConfig: BrandConfig = (() => {
        switch (entityId) {
          case 'GS000002':
            return {
              headerGradientStart: '#F47B20', headerGradientEnd: '#2E3192',
              accentColor: '#F47B20', footerType: 'image',
              footerImagePath: '/super_metro_logo.png',
            };
          case 'GS000006':
            return {
              headerGradientStart: '#1B5E20', headerGradientEnd: '#EF6C00',
              accentColor: '#FB8C00', footerType: 'text',
              footerTextPrimary: 'Bungoma', footerTextSecondary: 'Line',
              footerTextPrimaryColor: '#EF6C00', footerTextSecondaryColor: '#2E7D32',
            };
          default:
            return {
              headerGradientStart: '#1E88E5', headerGradientEnd: '#0D47A1',
              accentColor: '#1E88E5', footerType: 'image',
              footerImagePath: '/gopay_clear.png',
            };
        }
      })();

      const offscreen = document.createElement('canvas');
      offscreen.width = totalWidth;
      offscreen.height = totalHeight;
      const ctx = offscreen.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const draw = (logoImage?: HTMLImageElement) => {
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // ── Header ───────────────────────────────────────────────────
        const headerGradient = ctx.createLinearGradient(0, 0, totalWidth, headerHeight);
        headerGradient.addColorStop(0, brandConfig.headerGradientStart);
        headerGradient.addColorStop(1, brandConfig.headerGradientEnd);
        ctx.fillStyle = headerGradient;
        ctx.fillRect(0, 0, totalWidth, headerHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontFleet}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(fleetNumber, totalWidth / 2, headerHeight * 0.44);

        ctx.font = `${fontReg}px Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.fillText(regNumber, totalWidth / 2, headerHeight * 0.78);

        // ── Top accent line ───────────────────────────────────────────
        // (sits right below header, before QR padding)
        const topAccentY = headerHeight;
        ctx.fillStyle = brandConfig.accentColor;
        ctx.fillRect(0, topAccentY, totalWidth, accentBarH);

        // ── QR code ───────────────────────────────────────────────────
        const qrX = (totalWidth - qrSize) / 2;
        const qrY = topAccentY + accentBarH + qrPadding;
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

        const qrBottom = qrY + qrSize;

        // ── "SCAN TO PAY" text ────────────────────────────────────────
        // Centred in the scanTextHeight band
        const scanTextY = qrBottom + qrPadding + scanTextHeight * 0.65;
        ctx.font = `bold ${fontScanText}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = brandConfig.accentColor;
        ctx.fillText('SCAN TO PAY', totalWidth / 2, scanTextY);

        // ── Footer ────────────────────────────────────────────────────
        // Starts immediately after scanText band
        const footerStartY = qrBottom + qrPadding + scanTextHeight;
        const footerCentreY = footerStartY + footerHeight / 2;

        if (brandConfig.footerType === 'image' && logoImage) {
          const maxLogoW = totalWidth * 0.72;
          const maxLogoH = footerHeight * 0.72;
          const scale = Math.min(
            maxLogoW / logoImage.naturalWidth,
            maxLogoH / logoImage.naturalHeight
          );
          const logoW = logoImage.naturalWidth * scale;
          const logoH = logoImage.naturalHeight * scale;
          ctx.drawImage(
            logoImage,
            (totalWidth - logoW) / 2,
            footerCentreY - logoH / 2,
            logoW, logoH
          );
        } else if (brandConfig.footerType === 'text') {
          ctx.font = `bold ${fontFooter1}px Arial, sans-serif`;
          ctx.textAlign = 'left';
          const primaryW = ctx.measureText(brandConfig.footerTextPrimary!).width;
          const spaceW = ctx.measureText(' ').width;
          const secondaryW = ctx.measureText(brandConfig.footerTextSecondary!).width;
          let startX = (totalWidth - (primaryW + spaceW + secondaryW)) / 2;

          ctx.fillStyle = brandConfig.footerTextPrimaryColor!;
          ctx.fillText(brandConfig.footerTextPrimary!, startX, footerCentreY);
          startX += primaryW + spaceW;

          ctx.fillStyle = brandConfig.footerTextSecondaryColor!;
          ctx.fillText(brandConfig.footerTextSecondary!, startX, footerCentreY);

          ctx.font = `${fontFooter2}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = brandConfig.footerTextSecondaryColor!;
          ctx.fillText('Shuttle', totalWidth / 2, footerCentreY + fontFooter1 * 0.75);
        }

        // ── Bottom accent bar (flush to bottom edge) ──────────────────
        const bottomGradient = ctx.createLinearGradient(0, 0, totalWidth, 0);
        bottomGradient.addColorStop(0, brandConfig.headerGradientStart);
        bottomGradient.addColorStop(1, brandConfig.headerGradientEnd);
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(0, totalHeight - accentBarH * 2, totalWidth, accentBarH * 2);

        resolve(offscreen);
      };

      if (brandConfig.footerType === 'image' && brandConfig.footerImagePath) {
        const logo = new Image();
        logo.src = brandConfig.footerImagePath;
        logo.onload = () => draw(logo);
        logo.onerror = () => draw();
      } else {
        draw();
      }
    });
  }

  private buildBrandedQrCanvas26(): Promise<HTMLCanvasElement | null> {
    return new Promise((resolve) => {
      const qrCanvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!qrCanvas) { resolve(null); return; }

      const vehicle = this.selectedVehicleForQr;
      const fleetNumber = vehicle?.fleetNumber ?? 'Unknown Fleet';
      const regNumber = vehicle?.registrationNumber ?? 'Unknown Reg';
      const entityId = vehicle?.entityId ?? '';

      // ── Print dimensions: exactly 5cm × 8cm @ 300 DPI ────────────
      const DPI = 300;
      const CM_TO_INCH = 1 / 2.54;
      const totalWidth = Math.round(5 * CM_TO_INCH * DPI);  // 591 px
      const totalHeight = Math.round(8 * CM_TO_INCH * DPI);  // 945 px

      // ── Proportional layout budget (all from totalHeight) ─────────
      const headerHeight = Math.round(totalHeight * 0.12);  // 12% — header
      const logoHeight = Math.round(totalHeight * 0.12);  // 12% — brand logo zone
      const footerHeight = Math.round(totalHeight * 0.10);  // 10% — "SCAN TO PAY"
      const accentBarH = Math.round(totalHeight * 0.008); // 0.8% × 2 = bottom bar
      const qrPadding = Math.round(totalHeight * 0.02);  // 2%  — gap above/below QR

      // QR gets exactly what's left
      const qrSize = totalHeight
        - headerHeight
        - logoHeight
        - footerHeight
        - accentBarH * 2
        - qrPadding * 2;

      // ── Font sizes (proportional to totalWidth) ───────────────────
      const fontFleet = Math.round(totalWidth * 0.075);
      const fontReg = Math.round(totalWidth * 0.054);
      const fontScanText = Math.round(totalWidth * 0.09);
      const fontFooter2 = Math.round(totalWidth * 0.044); // for text-type "Shuttle" sub-label

      interface BrandConfig {
        headerGradientStart: string;
        headerGradientEnd: string;
        accentColor: string;
        logoType: 'image' | 'text';
        logoImagePath?: string;
        logoTextPrimary?: string;
        logoTextSecondary?: string;
        logoTextPrimaryColor?: string;
        logoTextSecondaryColor?: string;
      }

      const brandConfig: BrandConfig = (() => {
        switch (entityId) {
          case 'GS000002':
            return {
              headerGradientStart: '#F47B20', headerGradientEnd: '#2E3192',
              accentColor: '#F47B20', logoType: 'image',
              logoImagePath: '/super_metro_logo.png',
            };
          case 'GS000006':
            return {
              headerGradientStart: '#1B5E20', headerGradientEnd: '#EF6C00',
              accentColor: '#FB8C00', logoType: 'text',
              logoTextPrimary: 'Bungoma', logoTextSecondary: 'Line',
              logoTextPrimaryColor: '#EF6C00', logoTextSecondaryColor: '#2E7D32',
            };
          default:
            return {
              headerGradientStart: '#1E88E5', headerGradientEnd: '#0D47A1',
              accentColor: '#1E88E5', logoType: 'image',
              logoImagePath: '/gopay_clear.png',
            };
        }
      })();

      const offscreen = document.createElement('canvas');
      offscreen.width = totalWidth;
      offscreen.height = totalHeight;
      const ctx = offscreen.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const draw = (logoImage?: HTMLImageElement) => {
        // ── Background ────────────────────────────────────────────────
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // ── Header ────────────────────────────────────────────────────
        const headerGradient = ctx.createLinearGradient(0, 0, totalWidth, headerHeight);
        headerGradient.addColorStop(0, brandConfig.headerGradientStart);
        headerGradient.addColorStop(1, brandConfig.headerGradientEnd);
        ctx.fillStyle = headerGradient;
        ctx.fillRect(0, 0, totalWidth, headerHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontFleet}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(fleetNumber, totalWidth / 2, headerHeight * 0.44);

        ctx.font = `${fontReg}px Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.fillText(regNumber, totalWidth / 2, headerHeight * 0.78);

        // ── Brand logo zone (directly below header, no accent line) ──
        const logoZoneY = headerHeight;
        const logoCentreY = logoZoneY + logoHeight / 2;

        if (brandConfig.logoType === 'image' && logoImage) {
          const maxLogoW = totalWidth * 0.72;
          const maxLogoH = logoHeight * 0.72;
          const scale = Math.min(
            maxLogoW / logoImage.naturalWidth,
            maxLogoH / logoImage.naturalHeight
          );
          const logoW = logoImage.naturalWidth * scale;
          const logoH = logoImage.naturalHeight * scale;
          ctx.drawImage(
            logoImage,
            (totalWidth - logoW) / 2,
            logoCentreY - logoH / 2,
            logoW, logoH
          );
        } else if (brandConfig.logoType === 'text') {
          const fontLogo1 = Math.round(totalWidth * 0.082);
          ctx.font = `bold ${fontLogo1}px Arial, sans-serif`;
          ctx.textAlign = 'left';
          const primaryW = ctx.measureText(brandConfig.logoTextPrimary!).width;
          const spaceW = ctx.measureText(' ').width;
          const secondaryW = ctx.measureText(brandConfig.logoTextSecondary!).width;
          let startX = (totalWidth - (primaryW + spaceW + secondaryW)) / 2;

          ctx.fillStyle = brandConfig.logoTextPrimaryColor!;
          ctx.fillText(brandConfig.logoTextPrimary!, startX, logoCentreY);
          startX += primaryW + spaceW;

          ctx.fillStyle = brandConfig.logoTextSecondaryColor!;
          ctx.fillText(brandConfig.logoTextSecondary!, startX, logoCentreY);

          ctx.font = `${fontFooter2}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = brandConfig.logoTextSecondaryColor!;
          ctx.fillText('Shuttle', totalWidth / 2, logoCentreY + fontLogo1 * 0.75);
        }

        // ── QR code (below brand logo) ────────────────────────────────
        const qrX = (totalWidth - qrSize) / 2;
        const qrY = logoZoneY + logoHeight + qrPadding;
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

        const qrBottom = qrY + qrSize;

        // ── "SCAN TO PAY" footer text ─────────────────────────────────
        const footerStartY = qrBottom + qrPadding;
        const footerCentreY = footerStartY + footerHeight / 2;
        ctx.font = `bold ${fontScanText}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = brandConfig.accentColor;
        ctx.fillText('SCAN TO PAY', totalWidth / 2, footerCentreY);

        // ── Bottom accent bar (flush to bottom edge) ──────────────────
        const bottomGradient = ctx.createLinearGradient(0, 0, totalWidth, 0);
        bottomGradient.addColorStop(0, brandConfig.headerGradientStart);
        bottomGradient.addColorStop(1, brandConfig.headerGradientEnd);
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(0, totalHeight - accentBarH * 2, totalWidth, accentBarH * 2);

        resolve(offscreen);
      };

      if (brandConfig.logoType === 'image' && brandConfig.logoImagePath) {
        const logo = new Image();
        logo.src = brandConfig.logoImagePath;
        logo.onload = () => draw(logo);
        logo.onerror = () => draw();
      } else {
        draw();
      }
    });
  }

  async downloadQrAsPdf(): Promise<void> {
    const canvas = await this.buildBrandedQrCanvas();
    if (!canvas) return;

    const vehicle = this.selectedVehicleForQr;
    const fleetNumber = vehicle?.fleetNumber ?? 'Unknown';
    const regNumber = vehicle?.registrationNumber ?? 'Unknown';

    const imgData = canvas.toDataURL('image/png', 1.0);

    // Scale canvas px to mm (96dpi assumption)
    const pxToMm = 0.264583;
    const imgWidthMm = canvas.width * pxToMm;
    const imgHeightMm = canvas.height * pxToMm;

    const pdf = new jsPDF({
      orientation: imgWidthMm > imgHeightMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [imgWidthMm, imgHeightMm],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
    pdf.save(`QR_${fleetNumber}_${regNumber}.pdf`);
  }

  async printQrCode(): Promise<void> {
    const canvas = await this.buildBrandedQrCanvas();
    if (!canvas) return;

    const imgData = canvas.toDataURL('image/png', 1.0);

    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
    <html>
      <head>
        <title>QR Code - ${this.selectedVehicleForQr?.fleetNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
          img { max-width: 100%; height: auto; display: block; }
          @media print { body { background: white; } }
        </style>
      </head>
      <body>
        <img src="${imgData}" />
        <script>
          window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
        </script>
      </body>
    </html>
  `);
    printWindow.document.close();
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
