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
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { GeneralDriverAssignment } from '../../../../@core/models/driver_assignment/driver_assignment.model';
import { DriverAssignmentApiResponse } from '../../../../@core/models/driver_assignment/driver_assignment_response.mode';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { ActionButtonComponent } from '../../../components/action-button/action-button';
import { Paginator } from "primeng/paginator";

interface ApprovalStatusOption {
  label: string;
  value: string;
}

interface ApprovalFilterOption {
  label: string;
  value: string;
}

interface ActionApiResponse {
  status: number;
  message: string;
  data: any;
}

type DriverAssignmentStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED' | 'DORMANT';

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
    MessageModule,
    ToastModule,
    Paginator
  ],
  templateUrl: './all.html',
  styleUrls: ['./all.css'],
  providers: [MessageService],
})
export class AllDriverAssignmentsComponent implements OnInit {
  entityId: string | null = null;
  username: string | null = null;

  assignments: GeneralDriverAssignment[] = [];
  allAssignments: GeneralDriverAssignment[] = [];
  filteredAssignments: GeneralDriverAssignment[] = [];

  // Pagination
  rows: number = 10;
  first: number = 0;
  totalRecords: number = 0;

  searchTerm: string = '';
  selectedApprovalStatus: string = '';
  selectedApprovalFilter: string = '';

  // ── Detail dialog ──────────────────────────────────────────────────
  displayDetailDialog: boolean = false;
  selectedAssignment: GeneralDriverAssignment | null = null;

  // ── Approve / Reject confirmation dialog ──────────────────────────
  displayApproveRejectDialog: boolean = false;
  /** 'APPROVED' | 'REJECTED' — set before opening the dialog */
  pendingAction: 'APPROVED' | 'REJECTED' | null = null;

  // ── Activate confirmation dialog (for REJECTED or DORMANT) ────────
  displayActivateDialog: boolean = false;

  // ── Deactivate confirmation dialog (for ACTIVE) ───────────────────
  displayDeactivateDialog: boolean = false;

  /** Shared submitting guard — prevents double-clicks on any action */
  actionSubmitting: boolean = false;

  // Summary stats
  totalDrivers: number = 0;
  approvedDrivers: number = 0;
  pendingApprovals: number = 0;
  activeDrivers: number = 0;
  inactiveDrivers: number = 0;
  totalFleets: number = 0;

  // Filter options
  approvalStatusOptions: ApprovalStatusOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Dormant', value: 'DORMANT' },
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

  // ── Data loading ─────────────────────────────────────────────────

  loadAssignments($event?: any): void {
    let page = 0;
    let pageSize = this.rows;

    if ($event) {
      page = $event.first / $event.rows;
      pageSize = $event.rows;
      this.first = $event.first;
      this.rows = $event.rows;
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
        'all-driver-assignments',
      )
      .subscribe({
        next: (response) => {
          this.allAssignments = response.data;
          this.totalRecords = response.totalRecords;
          this.calculateStats();
          this.applyClientSideFilter();
          setTimeout(() => this.cdr.detectChanges())
        },
        error: (err) => {
          console.error('Failed to load driver assignments', err);
        },
        complete: () => this.loadingStore.stop()
      });
  }

  onPageChange(event: any): void {
    console.log('Page change event:', event);
    this.loadAssignments(event);
  }


  calculateStats(): void {
    this.totalDrivers = this.allAssignments.length;
    // Safely handle optional approved property
    this.approvedDrivers = this.allAssignments.filter((a) => a.approved === true).length;
    this.pendingApprovals = this.allAssignments.filter(
      (a) => a.status === 'PENDING'
    ).length;
    this.activeDrivers = this.allAssignments.filter(
      (a) => a.status === 'ACTIVE'
    ).length;
    this.inactiveDrivers = this.allAssignments.filter(
      (a) => a.status === 'INACTIVE'
    ).length;
    const uniqueFleets = new Set(this.allAssignments.map((a) => a.fleetNumber));
    this.totalFleets = uniqueFleets.size;
  }

  applyClientSideFilter(): void {
    let filtered = [...this.allAssignments];

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

    if (this.selectedApprovalStatus) {
      filtered = filtered.filter(
        (a) => a.status === this.selectedApprovalStatus
      );
    }

    if (this.selectedApprovalFilter) {
      if (this.selectedApprovalFilter === 'approved') {
        // Only show assignments where approved is explicitly true
        filtered = filtered.filter((a) => a.approved === true);
      } else if (this.selectedApprovalFilter === 'not-approved') {
        // Show assignments where approved is false or undefined
        filtered = filtered.filter((a) => a.approved !== true);
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

  refresh(): void {
    this.loadAssignments();
  }

  // ── Detail dialog ─────────────────────────────────────────────────

  viewAssignmentDetails(assignment: GeneralDriverAssignment): void {
    this.selectedAssignment = assignment;
    this.displayDetailDialog = true;
    setTimeout(() => this.cdr.detectChanges());
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
  }

  // ── Approve / Reject flow (for PENDING status) ────────────────────

  /**
   * Opens the approve/reject confirmation dialog.
   * Only used for PENDING assignments.
   * @param assignment  the row being acted on
   * @param action      'APPROVED' or 'REJECTED'
   * @param event       optional mouse event (stops row-click propagation)
   */
  openApproveRejectDialog(
    assignment: GeneralDriverAssignment,
    action: 'APPROVED' | 'REJECTED',
    event?: Event
  ): void {
    event?.stopPropagation();
    this.selectedAssignment = assignment;
    this.pendingAction = action;
    this.displayDetailDialog = false; // close detail if open
    this.displayApproveRejectDialog = true;
    setTimeout(() => this.cdr.detectChanges());
  }

  closeApproveRejectDialog(): void {
    this.displayApproveRejectDialog = false;
    this.pendingAction = null;
    setTimeout(() => {
      if (!this.displayApproveRejectDialog) this.selectedAssignment = null;
    }, 300);
  }

  confirmApproveReject(): void {
    if (!this.selectedAssignment || !this.pendingAction || !this.entityId)
      return;

    const assignment = this.selectedAssignment;
    const action = this.pendingAction;

    const payload = {
      entityId: assignment.entityId ?? this.entityId,
      id: assignment.id,
      status: action,
    };

    console.log('Approval payload:', payload);
    this.actionSubmitting = true;

    this.dataService
      .post<ActionApiResponse>(API_ENDPOINTS.ACTIVATE_DRIVER_ASSIGNMENT, payload)
      .subscribe({
        next: (response) => {
          this.actionSubmitting = false;
          if (response.status === 0) {
            this.messageService.add({
              severity: action === 'APPROVED' ? 'success' : 'warn',
              summary: action === 'APPROVED' ? 'Approved' : 'Rejected',
              detail:
                response.message ||
                `Assignment ${action.toLowerCase()} successfully.`,
              life: 4000,
            });
            this.closeApproveRejectDialog();
            this.loadAssignments();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Failed',
              detail: response.message || 'Action failed.',
              life: 5000,
            });
            this.closeApproveRejectDialog();
          }
        },
        error: (err) => {
          console.error('Approval/rejection error:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Server error. Please try again.',
            life: 5000,
          });
          this.actionSubmitting = false;
          this.closeApproveRejectDialog();
        },
        complete: () => this.cdr.detectChanges()
      });
  }

  // ── Activate flow (for REJECTED or DORMANT) ───────────────────────

  openActivateDialog(assignment: GeneralDriverAssignment, event?: Event): void {
    event?.stopPropagation();
    this.selectedAssignment = assignment;
    this.displayDetailDialog = false;
    this.displayActivateDialog = true;
    setTimeout(() => this.cdr.detectChanges());
  }

  closeActivateDialog(): void {
    this.displayActivateDialog = false;
    setTimeout(() => {
      if (!this.displayActivateDialog) this.selectedAssignment = null;
    }, 300);
  }

  confirmActivate(): void {
    if (!this.selectedAssignment || !this.entityId || !this.username) return;

    const assignment = this.selectedAssignment;
    const payload = {
      id: assignment.id,
      status: 'ACTIVE',
      entityId: assignment.entityId ?? this.entityId,
      username: this.username,
    };

    console.log('Activation payload:', payload);
    this.actionSubmitting = true;

    this.dataService
      .post<ActionApiResponse>(
        API_ENDPOINTS.ACTIVATE_DRIVER_ASSIGNMENT,
        payload
      )
      .subscribe({
        next: (response) => {
          this.actionSubmitting = false;
          if (response.status === 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'Activated',
              detail:
                response.message ||
                `${this.getFullName(assignment)} has been activated.`,
              life: 4000,
            });
            this.closeActivateDialog();
            this.loadAssignments();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Failed',
              detail: response.message || 'Activation failed.',
              life: 5000,
            });
            this.closeActivateDialog();
          }
          setTimeout(() => this.cdr.detectChanges());
        },
        error: (err) => {
          console.error('Activation error:', err);
          let msg = 'Activation failed. Please try again.';
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
          this.actionSubmitting = false;
          this.closeActivateDialog();
          setTimeout(() => this.cdr.detectChanges());
        },
      });
  }

  // ── Deactivate flow (for ACTIVE) ──────────────────────────────────

  openDeactivateDialog(
    assignment: GeneralDriverAssignment,
    event?: Event
  ): void {
    event?.stopPropagation();
    this.selectedAssignment = assignment;
    this.displayDetailDialog = false;
    this.displayDeactivateDialog = true;
    setTimeout(() => this.cdr.detectChanges());
  }

  closeDeactivateDialog(): void {
    this.displayDeactivateDialog = false;
    setTimeout(() => {
      if (!this.displayDeactivateDialog) this.selectedAssignment = null;
    }, 300);
  }

  confirmDeactivate(): void {
    if (!this.selectedAssignment || !this.entityId || !this.username) return;

    const assignment = this.selectedAssignment;
    const payload = {
      id: assignment.id,
      status: 'INACTIVE',
      entityId: assignment.entityId ?? this.entityId,
      username: this.username,
    };

    console.log('Deactivation payload:', payload);
    this.actionSubmitting = true;

    this.dataService
      .post<ActionApiResponse>(
        API_ENDPOINTS.DEACTIVATE_DRIVER_ASSIGNMENT,
        payload
      )
      .subscribe({
        next: (response) => {
          this.actionSubmitting = false;
          if (response.status === 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'Deactivated',
              detail:
                response.message ||
                `${this.getFullName(assignment)} has been deactivated.`,
              life: 4000,
            });
            this.closeDeactivateDialog();
            this.loadAssignments();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Failed',
              detail: response.message || 'Deactivation failed.',
              life: 5000,
            });
            this.closeDeactivateDialog();
          }
          setTimeout(() => this.cdr.detectChanges());
        },
        error: (err) => {
          console.error('Deactivation error:', err);
          let msg = 'Deactivation failed. Please try again.';
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
          this.actionSubmitting = false;
          this.closeDeactivateDialog();
          setTimeout(() => this.cdr.detectChanges());
        },
      });
  }

  // ── Status helpers ────────────────────────────────────────────────

  /**
   * Determines which actions are available for a given assignment status
   */
  canApprove(assignment: GeneralDriverAssignment): boolean {
    return assignment.status === 'PENDING';
  }

  canReject(assignment: GeneralDriverAssignment): boolean {
    return assignment.status === 'PENDING';
  }

  canActivate(assignment: GeneralDriverAssignment): boolean {
    // return assignment.status === 'REJECTED' || assignment.status === 'DORMANT' || assignment.status === 'INACTIVE';
    return assignment.status === 'PENDING'
  }

  canDeactivate(assignment: GeneralDriverAssignment): boolean {
    return assignment.status === 'ACTIVE';
  }

  // ── Helpers ───────────────────────────────────────────────────────

  getFullName(assignment: GeneralDriverAssignment | null): string {
    if (!assignment) return '';
    return `${assignment.firstName} ${assignment.lastName}`;
  }

  /**
   * Check if assignment has approval properties (PENDING or REJECTED)
   */
  hasApprovalProperties(assignment: GeneralDriverAssignment): boolean {
    return assignment.approved !== undefined && assignment.approvalCount !== undefined;
  }

  /**
   * Check if assignment has date properties (ACTIVE, INACTIVE, DORMANT)
   */
  hasDateProperties(assignment: GeneralDriverAssignment): boolean {
    return assignment.startDate !== undefined || assignment.endDate !== undefined;
  }

  /**
   * Get approval count safely
   */
  getApprovalCount(assignment: GeneralDriverAssignment): number {
    return assignment.approvalCount ?? 0;
  }

  /**
   * Check if assignment is approved (safely handles undefined)
   */
  isApproved(assignment: GeneralDriverAssignment): boolean {
    return assignment.approved === true;
  }

  getApprovalStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'warning',
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      REJECTED: 'rejected',
      DORMANT: 'dormant',
    };
    return map[status] ?? 'default';
  }

  getApprovalStatusIcon(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'pi pi-clock',
      ACTIVE: 'pi pi-check-circle',
      INACTIVE: 'pi pi-times-circle',
      REJECTED: 'pi pi-ban',
      DORMANT: 'pi pi-moon',
    };
    return map[status] ?? 'pi pi-circle';
  }
}
