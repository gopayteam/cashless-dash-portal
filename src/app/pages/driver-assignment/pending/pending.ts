// pages/driver-assignments/pending/pending-driver-assignments.component.ts
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
import { PendingDriverAssignmentApiResponse } from '../../../../@core/models/driver_assignment/driver_assignment_response.mode';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';

interface ApprovalStatusOption {
  label: string;
  value: string;
}

interface ApprovalResponse {
  status: number;
  message: string;
  data: any;
}

type ApprovalAction = 'APPROVED' | 'REJECTED';

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
    PaginatorModule,
  ],
  templateUrl: './pending.html',
  styleUrls: ['./pending.css', '../../../../styles/global/_toast.css'],
  providers: [MessageService],
})
export class AllPendingDriverAssignmentsComponent implements OnInit {
  entityId: string | null = null;
  username: string | null = null;

  assignments: PendingDriverAssignment[] = [];
  allAssignments: PendingDriverAssignment[] = [];
  filteredAssignments: PendingDriverAssignment[] = [];

  // Pagination state
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;
  currentPage: number = 0;

  searchTerm: string = '';
  selectedApprovalStatus: string = '';

  // Detail dialog
  displayDetailDialog: boolean = false;
  selectedAssignment: PendingDriverAssignment | null = null;

  // Approval confirm dialogs
  displayApproveDialog: boolean = false;
  displayRejectDialog: boolean = false;
  processing: boolean = false;

  // Summary stats
  totalDrivers: number = 0;
  totalFleets: number = 0;
  pendingApprovals: number = 0;

  approvalStatusOptions: ApprovalStatusOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  constructor(
    private dataService: DataService,
    public loadingStore: LoadingStore,
    public authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  get loading(): boolean {
    return this.loadingStore.loading();
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId;
      this.username = user.username || user.email;
    } else {
      this.router.navigate(['/login']);
      return;
    }
    this.loadAssignments();
  }

  // ── Data loading ────────────────────────────────────────────────────────

  /**
   * Load assignments from server with pagination support
   * Can be called by:
   * - Initial load (ngOnInit)
   * - Pagination changes (page navigation or rows per page change)
   * - Refresh button
   * - After approval/rejection actions
   */
  loadAssignments(event?: any): void {
    let page = this.currentPage;
    let pageSize = this.rows;

    // If event is provided, it's from pagination component
    if (event) {
      page = event.page !== undefined ? event.page : Math.floor(event.first / event.rows);
      pageSize = event.rows;
      this.first = event.first;
      this.rows = event.rows;
      this.currentPage = page;
    }

    const payload = {
      entityId: this.entityId,
      page,
      size: pageSize,
      status: 'PENDING',
    };

    console.log('Loading pending assignments with payload:', payload);

    this.loadingStore.start();

    this.dataService
      .post<PendingDriverAssignmentApiResponse>(
        API_ENDPOINTS.ALL_PENDING_REQUESTS,
        payload,
        'pending-driver-assignments',
        true
      )
      .subscribe({
        next: (response) => {
          console.log('Received response:', response);

          // Store the raw data from server
          this.allAssignments = response.data || [];
          this.totalRecords = response.totalRecords || 0;

          // Apply client-side filtering to current page data
          this.applyClientSideFilter();

          // Calculate stats from current page
          this.calculateStats();

          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        error: (err) => {
          console.error('Failed to load pending driver assignments:', err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load assignments. Please try again.',
            life: 5000,
          });

          this.allAssignments = [];
          this.assignments = [];
          this.filteredAssignments = [];
          this.totalRecords = 0;

          this.loadingStore.stop();
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Handle page change event from p-paginator
   */
  onPageChange(event: any): void {
    console.log('Page change event:', event);
    this.loadAssignments(event);
  }

  /**
   * Refresh current page data
   * Maintains current page and rows per page settings
   */
  refresh(): void {
    console.log('Refreshing current page');

    // Show success message for user feedback
    this.messageService.add({
      severity: 'info',
      summary: 'Refreshing',
      detail: 'Loading latest data...',
      life: 2000,
    });

    // Reload with current pagination state
    this.loadAssignments({
      first: this.first,
      rows: this.rows,
      page: this.currentPage,
    });
  }

  calculateStats(): void {
    // Stats are calculated from current page only
    this.totalDrivers = this.allAssignments.length;
    this.pendingApprovals = this.allAssignments.filter(
      (a) => a.approvalStatus === 'PENDING'
    ).length;
    const uniqueFleets = new Set(
      this.allAssignments.map((a) => a.fleetNumber)
    );
    this.totalFleets = uniqueFleets.size;
  }

  applyClientSideFilter(): void {
    let filtered = [...this.allAssignments];

    // Apply search filter to current page data
    if (this.searchTerm.trim()) {
      const lower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((a) => {
        const fullName = `${a.firstName} ${a.lastName}`.toLowerCase();
        return (
          fullName.includes(lower) ||
          a.phoneNumber?.includes(lower) ||
          a.fleetNumber?.toLowerCase().includes(lower) ||
          a.registrationNumber?.toLowerCase().includes(lower) ||
          a.investorNumber?.includes(lower) ||
          a.marshalNumber?.includes(lower) ||
          a.username?.toLowerCase().includes(lower)
        );
      });
    }

    // Apply status filter to current page data
    if (this.selectedApprovalStatus) {
      filtered = filtered.filter(
        (a) => a.approvalStatus === this.selectedApprovalStatus
      );
    }

    this.filteredAssignments = filtered;
    this.assignments = filtered;
  }

  onSearchChange(): void {
    // When searching, reset to first page and reload
    this.first = 0;
    this.currentPage = 0;
    this.applyClientSideFilter();

    // If you want server-side search, uncomment this:
    // this.loadAssignments({ first: 0, rows: this.rows, page: 0 });
  }

  onStatusChange(): void {
    // When filtering by status, reset to first page and reload
    this.first = 0;
    this.currentPage = 0;
    this.applyClientSideFilter();

    // If you want server-side filtering, uncomment this:
    // this.loadAssignments({ first: 0, rows: this.rows, page: 0 });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.first = 0;
    this.currentPage = 0;
    this.applyClientSideFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedApprovalStatus = '';
    this.first = 0;
    this.currentPage = 0;
    this.applyClientSideFilter();
  }

  // ── Detail dialog ────────────────────────────────────────────────────────

  viewAssignmentDetails(assignment: PendingDriverAssignment): void {
    this.selectedAssignment = assignment;
    this.displayDetailDialog = true;
    this.cdr.detectChanges();
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
  }

  // ── Approval flow ────────────────────────────────────────────────────────

  openApproveDialog(assignment: PendingDriverAssignment, event?: Event): void {
    event?.stopPropagation();
    this.selectedAssignment = assignment;
    this.displayDetailDialog = false;
    this.displayApproveDialog = true;
    this.cdr.detectChanges();
  }

  closeApproveDialog(): void {
    this.displayApproveDialog = false;
    setTimeout(() => {
      if (!this.displayApproveDialog) {
        this.selectedAssignment = null;
      }
    }, 300);
  }

  openRejectDialog(assignment: PendingDriverAssignment, event?: Event): void {
    event?.stopPropagation();
    this.selectedAssignment = assignment;
    this.displayDetailDialog = false;
    this.displayRejectDialog = true;
    this.cdr.detectChanges();
  }

  closeRejectDialog(): void {
    this.displayRejectDialog = false;
    setTimeout(() => {
      if (!this.displayRejectDialog) {
        this.selectedAssignment = null;
      }
    }, 300);
  }

  confirmApprove(): void {
    this.submitApproval('APPROVED');
  }

  confirmReject(): void {
    this.submitApproval('REJECTED');
  }

  submitApproval(action: ApprovalAction): void {
    if (!this.selectedAssignment || !this.entityId) return;

    const assignment = this.selectedAssignment;

    const payload = {
      entityId: assignment.entityId ?? this.entityId,
      id: assignment.id,
      status: action,
    };

    console.log('Approval payload:', payload);

    this.processing = true;

    this.dataService
      .post<ApprovalResponse>(
        API_ENDPOINTS.ACTIVATE_DRIVER_ASSIGNMENT,
        payload
      )
      .subscribe({
        next: (response) => {
          this.processing = false;

          if (response.status === 0) {
            const actionText = action === 'APPROVED' ? 'approved' : 'rejected';
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail:
                response.message ||
                `${this.getFullName(assignment)} has been ${actionText}.`,
              life: 4000,
            });

            this.closeApproveDialog();
            this.closeRejectDialog();

            // Reload current page to reflect changes
            this.loadAssignments({
              first: this.first,
              rows: this.rows,
              page: this.currentPage,
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Failed',
              detail: response.message || 'Request failed.',
              life: 5000,
            });
            this.closeApproveDialog();
            this.closeRejectDialog();
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Approval error:', err);

          let msg = 'Request failed. Please try again.';
          if (err.status === 404) msg = 'Driver assignment not found.';
          else if (err.status === 400)
            msg = err.error?.message || 'Invalid request.';
          else if (err.status === 500)
            msg = 'Server error. Please try again later.';
          else if (err.error?.message) msg = err.error.message;

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
            life: 5000,
          });

          this.processing = false;
          this.closeApproveDialog();
          this.closeRejectDialog();
          this.cdr.detectChanges();
        },
      });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  getFullName(assignment: PendingDriverAssignment): string {
    return `${assignment.firstName} ${assignment.lastName}`;
  }

  getApprovalStatusClass(status: string): string {
    const map: Record<string, string> = {
      APPROVED: 'active',
      PENDING: 'warning',
      REJECTED: 'rejected',
    };
    return map[status] ?? 'default';
  }

  getApprovalStatusIcon(status: string): string {
    const map: Record<string, string> = {
      APPROVED: 'pi pi-check-circle',
      PENDING: 'pi pi-clock',
      REJECTED: 'pi pi-ban',
    };
    return map[status] ?? 'pi pi-circle';
  }
}
