// pages/drivers/all.ts
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
import { GeneralDriverAssignment } from '../../../../@core/models/driver_assignment/driver_assignment.model';
import { DriverAssignmentApiResponse } from '../../../../@core/models/driver_assignment/driver_assignment_response.mode';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { ActionButtonComponent } from "../../../components/action-button/action-button";


interface ApprovalStatusOption {
  label: string;
  value: string;
}

interface ApprovalFilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-all-driver-assignments',
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
export class AllDriverAssignmentsComponent implements OnInit {
  entityId: string | null = null;
  assignments: GeneralDriverAssignment[] = [];
  allAssignments: GeneralDriverAssignment[] = [];
  filteredAssignments: GeneralDriverAssignment[] = [];

  // Pagination state
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  searchTerm: string = '';
  selectedApprovalStatus: string = '';
  selectedApprovalFilter: string = '';

  // Dialog state
  displayDetailDialog: boolean = false;
  selectedAssignment: GeneralDriverAssignment | null = null;

  // Summary stats
  totalDrivers: number = 0;
  approvedDrivers: number = 0;
  pendingApprovals: number = 0;
  totalFleets: number = 0;

  // Filter options
  approvalStatusOptions: ApprovalStatusOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  approvalFilterOptions: ApprovalFilterOption[] = [
    { label: 'All', value: '' },
    { label: 'Approved Only', value: 'approved' },
    { label: 'Not Approved', value: 'not-approved' },
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

    this.loadAssignments();
  }

  loadAssignments($event?: any): void {
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
      .post<DriverAssignmentApiResponse>(
        API_ENDPOINTS.ALL_DRIVER_ASSIGNMENTS,
        payload,
        'driver-assignments',
        true
      )
      .subscribe({
        next: (response) => {
          this.allAssignments = response.data;
          this.totalRecords = response.totalRecords;
          this.calculateStats();
          this.applyClientSideFilter();
          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load driver assignments', err);
          this.loadingStore.stop();
        },
      });
  }

  calculateStats(): void {
    this.totalDrivers = this.allAssignments.length;

    // Count unique fleets
    const uniqueFleets = new Set(this.allAssignments.map(a => a.fleetNumber));
    this.totalFleets = uniqueFleets.size;
  }

  applyClientSideFilter(): void {
    let filtered = [...this.allAssignments];

    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((assignment) => {
        const fullName = `${assignment.firstName} ${assignment.lastName}`.toLowerCase();
        return (
          fullName.includes(searchLower) ||
          assignment.phoneNumber?.includes(searchLower) ||
          assignment.fleetNumber?.toLowerCase().includes(searchLower) ||
          assignment.registrationNumber?.toLowerCase().includes(searchLower) ||
          assignment.investorNumber?.includes(searchLower) ||
          assignment.marshalNumber?.includes(searchLower) ||
          assignment.username?.toLowerCase().includes(searchLower)
        );
      });
    }

    this.filteredAssignments = filtered;
    this.assignments = filtered;
  }

  onSearchChange(): void {
    this.applyClientSideFilter();
  }

  onApprovalStatusChange(): void {
    this.applyClientSideFilter();
  }

  onApprovalFilterChange(): void {
    this.applyClientSideFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyClientSideFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedApprovalStatus = '';
    this.selectedApprovalFilter = '';
    this.applyClientSideFilter();
  }

  viewAssignmentDetails(assignment: GeneralDriverAssignment): void {
    this.selectedAssignment = assignment;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    // this.selectedAssignment = null;
  }

  getApprovalStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'warning',
      'ACTIVE': 'active',
      'INACTIVE': 'inactive',
      'REJECTED': 'rejected',
    };
    return statusMap[status] || 'default';
  }

  getApprovalStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'PENDING': 'pi pi-clock',
      'ACTIVE': 'pi pi-check-circle',
      'INACTIVE': 'pi pi-times-circle',
      'REJECTED': 'pi pi-ban',
    };
    return iconMap[status] || 'pi pi-circle';
  }


  getFullName(assignment: GeneralDriverAssignment): string {
    return `${assignment.firstName} ${assignment.lastName}`;
  }

  refresh(): void {
    this.loadAssignments();
  }
}
