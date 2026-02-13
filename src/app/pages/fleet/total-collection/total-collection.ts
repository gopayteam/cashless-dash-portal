import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import * as XLSX from 'xlsx';
import { formatDateLocal } from '../../../../@core/utils/date-time.util';
import { Subject } from 'rxjs';
import { PaginatorModule } from 'primeng/paginator';


Chart.register(...registerables);

export interface FleetCollectionModel {
  totalAmount: number;
  fleetNumber: string;
}

export interface FleetApiResponse {
  data: FleetCollectionModel[];
  totalElements: number;
  page: number;
  size: number;
}

interface SortOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-fleet-collections',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule,
    InputTextModule,
    SelectModule,
    MessageModule,
    ToastModule,
    PaginatorModule,
  ],
  templateUrl: './total-collection.html',
  styleUrls: ['./total-collection.css'],
  providers: [MessageService]
})
export class FleetCollectionsComponent implements OnInit, AfterViewInit {

  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutChartCanvas') donutChartCanvas!: ElementRef<HTMLCanvasElement>;

  entityId: string | null = null;
  selectedDate: string = '';

  allFleets: FleetCollectionModel[] = [];
  filteredFleets: FleetCollectionModel[] = [];
  displayedFleets: FleetCollectionModel[] = [];

  // Pagination
  page: number = 0;
  size: number = 20;
  totalElements: number = 0;

  // Search & Sort
  searchTerm: string = '';
  selectedSort: string = 'amount_desc';

  // View Toggle
  viewMode: 'cards' | 'list' = 'list';

  // Charts
  barChart: Chart | null = null;
  donutChart: Chart | null = null;
  showChart: boolean = false;

  // Stats
  totalRevenue: number = 0;
  topFleet: FleetCollectionModel | null = null;
  averageCollection: number = 0;
  activeFleetCount: number = 0;

  // Export
  isExporting: boolean = false;

  sortOptions: SortOption[] = [
    { label: 'Highest Earnings', value: 'amount_desc' },
    { label: 'Lowest Earnings', value: 'amount_asc' },
    { label: 'Fleet Number A–Z', value: 'fleet_asc' },
    { label: 'Fleet Number Z–A', value: 'fleet_desc' },
  ];

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  // get loading() {
  //   return this.loadingStore.loading;
  // }
  get loading(): boolean {
    return this.loadingStore.loading();
  }


  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId;
    } else {
      this.router.navigate(['/login']);
      return;
    }

    // Default to today
    this.selectedDate = formatDateLocal(new Date());

    this.loadCollections();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data loads
  }

  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageChange(event: any): void {
    this.page = event.page;
    this.size = event.rows;
    this.loadCollections();
  }

  loadCollections(): void {
    if (!this.entityId) return;

    this.loadingStore.start();

    const params = {
      entityId: this.entityId,
      date: this.selectedDate,
      size: this.size,
      page: this.page
    };

    this.dataService
      .get<FleetApiResponse>(
        API_ENDPOINTS.TOTAL_COLLECTION_PER_FLEET, params,
        'fleet-collections',
      )
      .subscribe({
        next: (response) => {
          // this.allFleets = response.data || [];
          this.allFleets = Array.isArray(response.data) ? response.data : [];
          this.totalElements = response.totalElements || 0;
          this.calculateStats();
          this.applyFilters();
          this.cdr.detectChanges();
          // Give DOM time to render before drawing charts
          setTimeout(() => this.renderCharts(), 100);
        },
        error: (err) => {
          console.error('Failed to load fleet collections', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load fleet collections',
            life: 4000
          });
          this.cdr.detectChanges();
        },
        complete: () => this.loadingStore.stop(),
      });
  }

  calculateStats(): void {
    if (!this.allFleets.length) {
      this.totalRevenue = 0;
      this.topFleet = null;
      this.averageCollection = 0;
      this.activeFleetCount = 0;
      return;
    }

    this.totalRevenue = this.allFleets.reduce((sum, f) => sum + f.totalAmount, 0);
    this.topFleet = [...this.allFleets].sort((a, b) => b.totalAmount - a.totalAmount)[0];
    this.averageCollection = this.totalRevenue / this.allFleets.length;
    this.activeFleetCount = this.allFleets.filter(f => f.totalAmount > 0).length;
  }

  applyFilters(): void {
    let result = [...this.allFleets];

    // Search
    if (this.searchTerm.trim()) {
      const lower = this.searchTerm.toLowerCase();
      result = result.filter(f => f.fleetNumber.toLowerCase().includes(lower));
    }

    // Sort
    switch (this.selectedSort) {
      case 'amount_desc': result.sort((a, b) => b.totalAmount - a.totalAmount); break;
      case 'amount_asc': result.sort((a, b) => a.totalAmount - b.totalAmount); break;
      case 'fleet_asc': result.sort((a, b) => a.fleetNumber.localeCompare(b.fleetNumber)); break;
      case 'fleet_desc': result.sort((a, b) => b.fleetNumber.localeCompare(a.fleetNumber)); break;
    }

    this.filteredFleets = result;
    this.displayedFleets = result;
  }

  onSearchChange(): void { this.page = 0; this.applyFilters(); }
  onSortChange(): void { this.applyFilters(); }
  onDateChange(): void { this.page = 0; this.loadCollections(); }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  refreshData(): void {
    this.loadCollections();
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'cards' ? 'list' : 'cards';
  }

  toggleChart(): void {
    this.showChart = !this.showChart;
    if (this.showChart) {
      // setTimeout(() => this.renderCharts(), 100);
      requestAnimationFrame(() => this.renderCharts());
    }
  }

  // ─── Chart Rendering ─────────────────────────────────────────────────────────

  renderCharts(): void {
    const top10 = [...this.allFleets]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    this.renderBarChart(top10);
    this.renderDonutChart(top10);
  }

  renderBarChart(data: FleetCollectionModel[]): void {
    if (!this.barChartCanvas) return;

    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }

    const ctx = this.barChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.9)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.6)');

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.fleetNumber),
        datasets: [{
          label: 'Total Collection (KES)',
          data: data.map(d => d.totalAmount),
          backgroundColor: gradient,
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` KES ${(ctx.parsed.y ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#6b7280' }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              color: '#6b7280',
              callback: (val) => `KES ${Number(val).toLocaleString()}`
            }
          }
        }
      }
    });
  }

  renderDonutChart(data: FleetCollectionModel[]): void {
    if (!this.donutChartCanvas) return;

    if (this.donutChart) {
      this.donutChart.destroy();
      this.donutChart = null;
    }

    const ctx = this.donutChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c',
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
      '#fa709a', '#fee140'
    ];

    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.fleetNumber),
        datasets: [{
          data: data.map(d => d.totalAmount),
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { size: 11 },
              color: '#374151',
              padding: 12,
              boxWidth: 12,
              boxHeight: 12
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` KES ${(ctx.raw as number).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
            }
          }
        }
      }
    });
  }

  // ─── Ranking / Styling Helpers ────────────────────────────────────────────────

  getRank(fleet: FleetCollectionModel): number {
    return this.allFleets
      .slice()
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .findIndex(f => f.fleetNumber === fleet.fleetNumber) + 1;
  }

  getRankClass(fleet: FleetCollectionModel): string {
    const rank = this.getRank(fleet);
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-default';
  }

  getRankIcon(fleet: FleetCollectionModel): string {
    const rank = this.getRank(fleet);
    if (rank === 1) return 'pi-trophy';
    if (rank === 2) return 'pi-star-fill';
    if (rank === 3) return 'pi-star';
    return 'pi-circle';
  }

  getPercentageOfTotal(amount: number): number {
    if (this.totalRevenue === 0) return 0;
    return (amount / this.totalRevenue) * 100;
  }

  getProgressBarColor(fleet: FleetCollectionModel): string {
    const pct = this.getPercentageOfTotal(fleet.totalAmount);
    if (pct >= 15) return '#10b981';
    if (pct >= 8) return '#3b82f6';
    if (pct >= 4) return '#f59e0b';
    return '#6b7280';
  }

  formatCurrency(amount: number): string {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // ─── Export ───────────────────────────────────────────────────────────────────

  exportToExcel(): void {
    if (!this.filteredFleets.length) {
      this.messageService.add({ severity: 'warn', summary: 'No Data', detail: 'No data to export', life: 3000 });
      return;
    }
    try {
      this.isExporting = true;
      const exportData = this.filteredFleets.map((f, i) => ({
        'Rank': i + 1,
        'Fleet Number': f.fleetNumber,
        'Total Collection (KES)': f.totalAmount,
        '% of Total': `${this.getPercentageOfTotal(f.totalAmount).toFixed(2)}%`,
        'Date': this.selectedDate
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Fleet Collections');
      const timestamp = formatDateLocal(new Date());
      XLSX.writeFile(wb, `fleet_collections_${this.selectedDate}_${timestamp}.xlsx`);
      this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'Excel file downloaded', life: 3000 });
    } catch (e) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Export failed', life: 3000 });
    } finally {
      this.isExporting = false;
    }
  }

  exportToCSV(): void {
    if (!this.filteredFleets.length) {
      this.messageService.add({ severity: 'warn', summary: 'No Data', detail: 'No data to export', life: 3000 });
      return;
    }
    try {
      this.isExporting = true;
      const exportData = this.filteredFleets.map((f, i) => ({
        'Rank': i + 1,
        'Fleet Number': f.fleetNumber,
        'Total Collection (KES)': f.totalAmount,
        '% of Total': `${this.getPercentageOfTotal(f.totalAmount).toFixed(2)}%`,
        'Date': this.selectedDate
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const timestamp = formatDateLocal(new Date());
      link.href = URL.createObjectURL(blob);
      link.download = `fleet_collections_${this.selectedDate}_${timestamp}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'CSV file downloaded', life: 3000 });
    } catch (e) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Export failed', life: 3000 });
    } finally {
      this.isExporting = false;
    }
  }
}
