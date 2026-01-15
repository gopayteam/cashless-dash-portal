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
import { DriverAssignment } from '../../../../@core/models/driver_assignment/driver_assignment.model';
import { DriverAssignmentApiResponse } from '../../../../@core/models/driver_assignment/driver_assignment_response.mode';


interface ApprovalStatusOption {
  label: string;
  value: string;
}

interface ApprovalFilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-all-inactive-driver-assignments',
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
  ],
  templateUrl: './inactive.html',
  styleUrls: ['./inactive.css', '../../../../styles/modules/_dialog_module.css'],
})
export class AllInactiveDriverAssignmentsComponent implements OnInit {
  assignments: DriverAssignment[] = [];
  allAssignments: DriverAssignment[] = [];
  filteredAssignments: DriverAssignment[] = [];

  // Pagination state
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  searchTerm: string = '';
  selectedApprovalStatus: string = '';
  selectedApprovalFilter: string = '';

  // Dialog state
  displayDetailDialog: boolean = false;
  selectedAssignment: DriverAssignment | null = null;

  // Summary stats
  totalDrivers: number = 0;
  approvedDrivers: number = 0;
  pendingApprovals: number = 0;
  totalFleets: number = 0;

  // Filter options
  approvalStatusOptions: ApprovalStatusOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
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
    private cdr: ChangeDetectorRef
  ) {}

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
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
      entityId: 'GS000002',
      page,
      size: pageSize,
      status: 'INACTIVE',
    };

    this.loadingStore.start();

    this.dataService
      .post<DriverAssignmentApiResponse>(
        API_ENDPOINTS.ALL_DRIVER_ASSIGNMENTS,
        payload,
        'driver-assignments'
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
    this.approvedDrivers = this.allAssignments.filter(a => a.approved).length;
    this.pendingApprovals = this.allAssignments.filter(
      a => a.approvalStatus === 'PENDING'
    ).length;

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

    // Apply approval status filter
    if (this.selectedApprovalStatus && this.selectedApprovalStatus !== '') {
      filtered = filtered.filter(
        assignment => assignment.approvalStatus === this.selectedApprovalStatus
      );
    }

    // Apply approved/not approved filter
    if (this.selectedApprovalFilter && this.selectedApprovalFilter !== '') {
      if (this.selectedApprovalFilter === 'approved') {
        filtered = filtered.filter(assignment => assignment.approved);
      } else if (this.selectedApprovalFilter === 'not-approved') {
        filtered = filtered.filter(assignment => !assignment.approved);
      }
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

  viewAssignmentDetails(assignment: DriverAssignment): void {
    this.selectedAssignment = assignment;
    this.displayDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
    this.selectedAssignment = null;
  }

  getApprovalStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'warning',
      'APPROVED': 'active',
      'REJECTED': 'inactive',
    };
    return statusMap[status] || 'default';
  }

  getApprovalStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'PENDING': 'pi-clock',
      'APPROVED': 'pi-check-circle',
      'REJECTED': 'pi-times-circle',
    };
    return iconMap[status] || 'pi-circle';
  }

  getFullName(assignment: DriverAssignment): string {
    return `${assignment.firstName} ${assignment.lastName}`;
  }
}
