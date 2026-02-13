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
import { PendingDriverAssignment } from '../../../../@core/models/driver_assignment/driver_assignment.model';
import { DriverAssignmentApiResponse, PendingDriverAssignmentApiResponse } from '../../../../@core/models/driver_assignment/driver_assignment_response.mode';
import { Router } from '@angular/router';
import { AuthService } from '../../../../@core/services/auth.service';
import { MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
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
  selector: 'app-all-pending-driver-assignments',
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
    MessageModule,
    ToastModule,
    ActionButtonComponent
  ],
  templateUrl: './pending.html',
  styleUrls: ['./pending.css', '../../../../styles/global/_toast.css'],
})
export class AllPendingDriverAssignmentsComponent implements OnInit {
  entityId: string | null = null;
  assignments: PendingDriverAssignment[] = [];
  allAssignments: PendingDriverAssignment[] = [];
  filteredAssignments: PendingDriverAssignment[] = [];

  // Pagination state
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  searchTerm: string = '';
  selectedApprovalStatus: string = '';
  selectedApprovalFilter: string = '';

  // Dialog state
  displayDetailDialog: boolean = false;
  selectedAssignment: PendingDriverAssignment | null = null;

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
      status: 'PENDING',
    };

    this.loadingStore.start();

    this.dataService
      .post<PendingDriverAssignmentApiResponse>(
        API_ENDPOINTS.ALL_PENDING_REQUESTS,
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

  viewAssignmentDetails(assignment: PendingDriverAssignment): void {
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


  getFullName(assignment: PendingDriverAssignment): string {
    return `${assignment.firstName} ${assignment.lastName}`;
  }

  submitApproval(action: ApprovalAction): void {
    if (!this.selectedAssignment) return;

    const assignment = this.selectedAssignment;
    const payload = {
      entityId: assignment.entityId,
      id: assignment.id,
      status: action
    };

    console.log('approval payload', payload);

    this.dataService
      .post<ApprovalResponse>(API_ENDPOINTS.ACTIVATE_DRIVER_ASSIGNMENT, payload)
      .subscribe({
        next: (response) => {
          if (response.status === 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message || `Request ${action.toLowerCase()} successfully.`
            });

            // Update UI immediately
            assignment.approvalStatus = action as any;
            (assignment as any).approvalStatus = action === 'APPROVED';

            this.closeDetailDialog();
            this.loadAssignments(); // reload table

          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Failed',
              detail: response.message || 'Request failed.'
            });
          }
        },
        error: (error) => {
          console.error('HTTP Error:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'System Error',
            detail: 'Server is unreachable. Try again later.'
          });
        }
      });
  }

  refresh(): void {
    this.loadAssignments();
  }

}
