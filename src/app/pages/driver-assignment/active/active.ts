// pages/driver-assignments/active/active-driver-assignments.component.ts
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
import { ActiveDriverAssignment } from '../../../../@core/models/driver_assignment/driver_assignment.model';
import { ActiveDriverAssignmentApiResponse } from '../../../../@core/models/driver_assignment/driver_assignment_response.mode';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ActionButtonComponent } from '../../../components/action-button/action-button';

interface ApprovalStatusOption {
  label: string;
  value: string;
}

interface DeactivateApiResponse {
  status: number;
  message: string;
  data: any;
}

@Component({
  selector: 'app-all-active-driver-assignments',
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
    // ActionButtonComponent,
  ],
  templateUrl: './active.html',
  styleUrls: ['./active.css', '../../../../styles/global/_toast.css'],
  providers: [MessageService],
})
export class AllActiveDriverAssignmentsComponent implements OnInit {
  entityId: string | null = null;
  username: string | null = null;

  assignments: ActiveDriverAssignment[] = [];
  allAssignments: ActiveDriverAssignment[] = [];
  filteredAssignments: ActiveDriverAssignment[] = [];

  // Pagination
  rows: number = 100;
  first: number = 0;
  totalRecords: number = 0;

  searchTerm: string = '';
  selectedApprovalStatus: string = '';

  // Detail dialog
  displayDetailDialog: boolean = false;
  selectedAssignment: ActiveDriverAssignment | null = null;

  // Deactivation confirm dialog
  displayDeactivateDialog: boolean = false;
  deactivating: boolean = false;

  // Summary stats
  totalDrivers: number = 0;
  totalFleets: number = 0;

  approvalStatusOptions: ApprovalStatusOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
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
      status: 'ACTIVE',
    };

    this.loadingStore.start();

    this.dataService
      .post<ActiveDriverAssignmentApiResponse>(
        API_ENDPOINTS.ALL_ACTIVE_DRIVERS,
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
          console.error('Failed to load active driver assignments', err);
          this.loadingStore.stop();
        },
      });
  }

  calculateStats(): void {
    this.totalDrivers = this.allAssignments.length;
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
        (a) => (a as any).status === this.selectedApprovalStatus
      );
    }

    this.filteredAssignments = filtered;
    this.assignments = filtered;
  }

  onSearchChange(): void { this.applyClientSideFilter(); }
  onStatusChange(): void { this.applyClientSideFilter(); }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyClientSideFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedApprovalStatus = '';
    this.applyClientSideFilter();
  }

  refresh(): void {
    this.loadAssignments();
  }

  // ── Detail dialog ────────────────────────────────────────────────────────

  viewAssignmentDetails(assignment: ActiveDriverAssignment): void {
    this.selectedAssignment = assignment;
    this.displayDetailDialog = true;
    this.cdr.detectChanges();
  }

  closeDetailDialog(): void {
    this.displayDetailDialog = false;
  }

  // ── Deactivation flow ────────────────────────────────────────────────────

  /**
   * Opens the confirmation dialog for deactivating a driver assignment.
   * Can be called from both the table row action and the detail dialog.
   * Stops event propagation so row-click doesn't also open the detail dialog.
   */
  openDeactivateDialog(assignment: ActiveDriverAssignment, event?: Event): void {
    event?.stopPropagation();
    this.selectedAssignment = assignment;
    this.displayDetailDialog = false;   // close detail if open
    this.displayDeactivateDialog = true;
    this.cdr.detectChanges();
  }

  closeDeactivateDialog(): void {
    this.displayDeactivateDialog = false;
    // Keep selectedAssignment so the template can still show the name
    // while the dialog animates out; clear it after a tick.
    setTimeout(() => {
      if (!this.displayDeactivateDialog) {
        this.selectedAssignment = null;
      }
    }, 300);
  }

  /**
   * Submits the deactivation request.
   * Mirrors the old Angular Material component's handleAction('deactivate'),
   * sending status: 'INACTIVE' to the deactivate endpoint.
   */
  confirmDeactivate(): void {
    if (!this.selectedAssignment || !this.entityId || !this.username) return;

    const assignment = this.selectedAssignment;

    const payload = {
      id: assignment.id,
      status: 'INACTIVE',
      entityId: assignment.entityId ?? this.entityId,
      username: this.username,
    };

    console.log('Deactivating driver assignment:', payload);

    this.deactivating = true;

    this.dataService
      .post<DeactivateApiResponse>(
        API_ENDPOINTS.DEACTIVATE_DRIVER_ASSIGNMENT,
        payload
      )
      .subscribe({
        next: (response) => {
          this.deactivating = false;

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
            this.loadAssignments(); // refresh the list
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Failed',
              detail: response.message || 'Deactivation failed.',
              life: 5000,
            });
            this.closeDeactivateDialog();
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Deactivation error:', err);

          let msg = 'Deactivation failed. Please try again.';
          if (err.status === 404) msg = 'Driver assignment not found.';
          else if (err.status === 400) msg = err.error?.message || 'Invalid request.';
          else if (err.status === 500) msg = 'Server error. Please try again later.';
          else if (err.error?.message) msg = err.error.message;

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
            life: 5000,
          });

          this.deactivating = false;
          this.closeDeactivateDialog();
          this.cdr.detectChanges();
        },
      });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  getFullName(assignment: ActiveDriverAssignment): string {
    return `${assignment.firstName} ${assignment.lastName}`;
  }

  getApprovalStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      PENDING: 'warning',
      REJECTED: 'rejected',
    };
    return map[status] ?? 'default';
  }

  getApprovalStatusIcon(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'pi pi-check-circle',
      INACTIVE: 'pi pi-times-circle',
      PENDING: 'pi pi-clock',
      REJECTED: 'pi pi-ban',
    };
    return map[status] ?? 'pi pi-circle';
  }
}
