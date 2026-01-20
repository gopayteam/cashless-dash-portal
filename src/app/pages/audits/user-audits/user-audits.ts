// pages/audits/user-audits.component.ts
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { Audit } from '../../../../@core/models/audits/audit.model';
import { AuditApiResponse } from '../../../../@core/models/audits/audit_response.model';
import { SelectModule } from 'primeng/select';

interface MethodOption {
  label: string;
  value: string;
}

interface OSOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-user-audits',
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
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  templateUrl: './user-audits.html',
  styleUrls: [
    './user-audits.css',
    '../../../../styles/modules/_audit_module.css',
  ],
})
export class UserAudits implements OnInit {
  audits: Audit[] = [];
  allAudits: Audit[] = [];
  filteredAudits: Audit[] = [];
  dateRange: Date[] = [];

  // Pagination state
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  // Filters
  username: string = '';
  searchTerm: string = '';
  selectedMethod: string = '';
  selectedOS: string = '';

  // Dialog state
  displayDetailDialog: boolean = false;
  selectedAudit: Audit | null = null;

  // Summary stats
  totalAudits: number = 0;
  uniqueIPs: number = 0;
  postRequests: number = 0;
  getRequests: number = 0;

  // Filter options
  methodOptions: MethodOption[] = [
    { label: 'All Methods', value: '' },
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
    { label: 'PATCH', value: 'PATCH' },
  ];

  osOptions: OSOption[] = [
    { label: 'All OS', value: '' },
    { label: 'Windows', value: 'Windows' },
    { label: 'Mac OS', value: 'Mac OS' },
    { label: 'Linux', value: 'Linux' },
    { label: 'Android', value: 'Android' },
    { label: 'iOS', value: 'iOS' },
  ];

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    private cdr: ChangeDetectorRef
  ) {}

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    this.setDefaultDateRange();
    // You can set a default username or get it from a service/route
    this.username = 'super.metro@gmail.com';
    this.loadAudits();
  }

  setDefaultDateRange(): void {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    this.dateRange = [lastMonth, today];
  }

  loadAudits($event?: any): void {
    if (!this.username || this.username.trim() === '') {
      console.error('Username is required');
      return;
    }

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
      username: this.username,
      page,
      size: pageSize,
    };

    this.loadingStore.start();

    this.dataService
      .post<AuditApiResponse>(API_ENDPOINTS.ALL_AUDIT_TRAILS, payload, 'audits-user')
      .subscribe({
        next: (response) => {
          this.allAudits = response.data;
          this.totalRecords = response.totalRecords;
          this.calculateStats();
          this.applyClientSideFilter();
          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load audits', err);
          this.loadingStore.stop();
        },
      });
  }

  calculateStats(): void {
    this.totalAudits = this.allAudits.length;

    // Count unique IPs
    const uniqueIPs = new Set(this.allAudits.map(a => a.ipAddress));
    this.uniqueIPs = uniqueIPs.size;

    this.postRequests = this.allAudits.filter(a => a.method === 'POST').length;
    this.getRequests = this.allAudits.filter(a => a.method === 'GET').length;
  }

  applyClientSideFilter(): void {
    let filtered = [...this.allAudits];

    // Apply date range filter
    if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
      const [start, end] = this.dateRange;
      filtered = filtered.filter(audit => {
        const auditDate = new Date(audit.createdOn);
        return auditDate >= start && auditDate <= end;
      });
    }

    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((audit) => {
        return (
          audit.requestUrl?.toLowerCase().includes(searchLower) ||
          audit.description?.toLowerCase().includes(searchLower) ||
          audit.ipAddress?.includes(searchLower) ||
          audit.method?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply method filter
    if (this.selectedMethod && this.selectedMethod !== '') {
      filtered = filtered.filter(audit => audit.method === this.selectedMethod);
    }

    // Apply OS filter
    if (this.selectedOS && this.selectedOS !== '') {
      filtered = filtered.filter(audit => audit.operatingSystem === this.selectedOS);
    }

    this.filteredAudits = filtered;
    this.audits = filtered;
  }

  onSearchChange(): void {
    this.applyClientSideFilter();
  }

  onMethodChange(): void {
    this.applyClientSideFilter();
  }

  onOSChange(): void {
    this.applyClientSideFilter();
  }

  onDateRangeChange(): void {
    this.applyClientSideFilter();
  }

  onUsernameChange(): void {
    this.first = 0;
    this.loadAudits();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyClientSideFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedMethod = '';
    this.selectedOS = '';
    this.setDefaultDateRange();
    this.applyClientSideFilter();
  }

  viewAuditDetails(audit: Audit): void {
    this.selectedAudit = audit;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedAudit = null;
  }

  getMethodClass(method: string): string {
    const methodMap: { [key: string]: string } = {
      'GET': 'get',
      'POST': 'post',
      'PUT': 'put',
      'DELETE': 'delete',
      'PATCH': 'patch',
    };
    return methodMap[method] || 'default';
  }

  getMethodIcon(method: string): string {
    const iconMap: { [key: string]: string } = {
      'GET': 'pi-download',
      'POST': 'pi-upload',
      'PUT': 'pi-pencil',
      'DELETE': 'pi-trash',
      'PATCH': 'pi-file-edit',
    };
    return iconMap[method] || 'pi-circle';
  }

  getOSIcon(os: string): string {
    const iconMap: { [key: string]: string } = {
      'Windows': 'pi-microsoft',
      'Mac OS': 'pi-apple',
      'Linux': 'pi-desktop',
      'Android': 'pi-android',
      'iOS': 'pi-apple',
    };
    return iconMap[os] || 'pi-desktop';
  }

  formatRequestBody(body: string): string {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // You can show a toast notification here
      console.log('Copied to clipboard');
    });
  }
}
