// pages/booking/conflict-dashboard/conflict-dashboard.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';

import { BookingConflictService } from '../../../../@core/services/booking-conflict.service';
import { AppNotificationService } from '../../../../@core/services/app-notification.service';
import { AuthService } from '../../../../@core/services/auth.service';
import { Router } from '@angular/router';
import { ConflictType, SeatConflict } from '../../../../@core/models/booking/booking-conflict.model';
import { Paginator } from 'primeng/paginator';

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-conflict-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    DialogModule,
    ToastModule,
    SelectModule,
  ],
  providers: [MessageService],
  templateUrl: './trip-conflicts.html',
  styleUrls: ['./trip-conflicts.css', '../../../../styles/global/_toast.css'],
})
export class ConflictDashboardComponent implements OnInit {
  conflicts: SeatConflict[] = [];
  filteredConflicts: SeatConflict[] = [];
  scanning = false;
  entityId: string | null = null;

  // ── Server-side scan filter ────────────────────────────────────────────────
  /**
   * Which trip status to pass to scanForConflicts().
   * Changing this and clicking "Scan Now" triggers a fresh server fetch.
   * Defaults to IN_PROGRESS to match the service default.
   */
  selectedScanTripStatus: string = 'PENDING';

  // ── Client-side display filters ────────────────────────────────────────────
  selectedType: string = '';
  selectedSeverity: string = '';
  selectedStatus: string = '';
  /**
   * Filters the already-loaded conflict list by the trip status that was
   * stored on the conflict at detection time. Does NOT re-fetch.
   */
  selectedTripStatusFilter: string = '';

  // ── Dropdown options ───────────────────────────────────────────────────────

  scanTripStatusOptions: FilterOption[] = [
    { label: 'Pending Trips', value: 'PENDING' },
    { label: 'In Progress Trips', value: 'IN_PROGRESS' },
    { label: 'Complete Trips', value: 'COMPLETE' },
  ];

  typeFilterOptions: FilterOption[] = [
    { label: 'All Types', value: '' },
    { label: 'Double Booking', value: 'DOUBLE_BOOKING' },
    { label: 'Over Capacity', value: 'OVER_CAPACITY' },
    { label: 'Unmatched Transaction', value: 'ORPHAN_TRANSACTION' },
    { label: 'Unmatched Reservation', value: 'ORPHAN_RESERVATION' },
  ];

  severityFilterOptions: FilterOption[] = [
    { label: 'All Severities', value: '' },
    { label: 'High', value: 'HIGH' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'Low', value: 'LOW' },
  ];

  statusFilterOptions: FilterOption[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'Resolved', value: 'resolved' },
  ];

  /**
   * Client-side filter — shows conflicts detected from trips of a particular status.
   * Populated from the tripStatus stored on each SeatConflict.
   */
  tripStatusFilterOptions: FilterOption[] = [
    { label: 'All Trip Statuses', value: '' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Complete', value: 'COMPLETE' },
  ];

  // ── Detail dialog ──────────────────────────────────────────────────────────
  showDetailDialog = false;
  selectedConflict: SeatConflict | null = null;

  constructor(
    private conflictService: BookingConflictService,
    private notificationService: AppNotificationService,
    private authService: AuthService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId;
    } else {
      this.router.navigate(['/login']);
      return;
    }

    this.refreshConflictList();
  }

  // ── Scan ───────────────────────────────────────────────────────────────────

  runScan(): void {
    if (!this.entityId) return;
    this.scanning = true;

    this.conflictService
      .scanForConflicts(this.entityId, this.selectedScanTripStatus)
      .subscribe({
        next: conflicts => {
          this.scanning = false;
          this.refreshConflictList();

          const newCount = conflicts.filter(c => !c.resolved).length;
          this.messageService.add({
            severity: newCount > 0 ? 'warn' : 'success',
            summary: newCount > 0 ? 'Conflicts Found' : 'All Clear',
            detail: newCount > 0
              ? `${newCount} conflict(s) detected across ${this.selectedScanTripStatus} trips.`
              : `No conflicts detected across all ${this.selectedScanTripStatus} trips.`,
            life: 5000,
          });

          this.cdr.detectChanges();
        },
        error: () => {
          this.scanning = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Scan Failed',
            detail: 'Could not complete the conflict scan. Please try again.',
            life: 5000,
          });
        },
      });
  }

  // ── List management ────────────────────────────────────────────────────────

  refreshConflictList(): void {
    this.conflicts = this.conflictService.getAllConflicts();
    this.applyFilter();
  }

  applyFilter(): void {
    let result = [...this.conflicts];

    if (this.selectedType) {
      result = result.filter(c => c.type === this.selectedType);
    }
    if (this.selectedSeverity) {
      result = result.filter(c => c.severity === this.selectedSeverity);
    }
    if (this.selectedStatus === 'open') {
      result = result.filter(c => !c.resolved);
    } else if (this.selectedStatus === 'resolved') {
      result = result.filter(c => c.resolved);
    }
    // Client-side trip-status filter — uses the tripStatus stored on each conflict
    if (this.selectedTripStatusFilter) {
      result = result.filter(c => c.tripStatus === this.selectedTripStatusFilter);
    }

    this.filteredConflicts = result;
  }

  // ── Computed helpers ───────────────────────────────────────────────────────

  get unresolvedConflicts(): SeatConflict[] {
    return this.conflicts.filter(c => !c.resolved);
  }

  countByType(type: ConflictType): number {
    return this.conflicts.filter(c => c.type === type && !c.resolved).length;
  }

  // ── Resolve actions ────────────────────────────────────────────────────────

  viewConflict(conflict: SeatConflict): void {
    this.selectedConflict = conflict;
    this.showDetailDialog = true;
  }

  resolveConflict(conflict: SeatConflict): void {
    this.conflictService.resolveConflict(conflict.conflictId);
    this.notificationService.markAsRead(`conflict_${conflict.conflictId}`);
    this.refreshConflictList();
    this.showDetailDialog = false;

    this.messageService.add({
      severity: 'success',
      summary: 'Resolved',
      detail: `Conflict on trip #${conflict.tripId} marked as resolved.`,
      life: 3000,
    });
  }

  resolveAll(): void {
    this.unresolvedConflicts.forEach(c => {
      this.conflictService.resolveConflict(c.conflictId);
      this.notificationService.markAsRead(`conflict_${c.conflictId}`);
    });
    this.refreshConflictList();

    this.messageService.add({
      severity: 'success',
      summary: 'All Resolved',
      detail: 'All open conflicts have been marked as resolved.',
      life: 3000,
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Navigate to the trip transactions page for the conflict's trip.
   * Passes tripId via both the route param and navigation state
   * to match the resolution logic in TripTransactionsComponent.
   */
  goToTransactions(conflict: SeatConflict): void {
    this.showDetailDialog = false;
    this.router.navigate(
      ['/booking/trip-transactions', conflict.tripId],
      { state: { tripId: conflict.tripId, timestamp: Date.now() } }
    );
  }

  /**
   * Navigate to the seat reservations page for the conflict's trip.
   * Passes tripId via both the route param and navigation state
   * to match the resolution logic in SeatReservationsComponent.
   */
  goToReservations(conflict: SeatConflict): void {
    this.showDetailDialog = false;
    this.router.navigate(
      ['/booking/seat-reservation', conflict.tripId],
      { state: { tripId: conflict.tripId, timestamp: Date.now() } }
    );
  }

  // ── Tag helpers ────────────────────────────────────────────────────────────

  conflictTypeLabel(type: ConflictType): string {
    const map: Record<ConflictType, string> = {
      DOUBLE_BOOKING: 'Double Booking',
      OVER_CAPACITY: 'Over Capacity',
      ORPHAN_TRANSACTION: 'Unmatched Txn',
      ORPHAN_RESERVATION: 'Unmatched Res',
    };
    return map[type] ?? type;
  }

  conflictTypeSeverity(
    type: ConflictType
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const map: Record<
      ConflictType,
      'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'
    > = {
      DOUBLE_BOOKING: 'danger',
      OVER_CAPACITY: 'danger',
      ORPHAN_TRANSACTION: 'warn',
      ORPHAN_RESERVATION: 'info',
    };
    return map[type] ?? 'info';
  }

  severityTagColor(
    severity: string
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const map: Record<
      string,
      'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'
    > = {
      HIGH: 'danger',
      MEDIUM: 'warn',
      LOW: 'info',
    };
    return map[severity] ?? 'info';
  }

  tripStatusTagColor(
    status: string
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const map: Record<
      string,
      'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'
    > = {
      COMPLETE: 'success',
      IN_PROGRESS: 'info',
      PENDING: 'warn',
    };
    return map[status] ?? 'secondary';
  }

  tripStatusLabel(status: string): string {
    const map: Record<string, string> = {
      COMPLETE: 'Complete',
      IN_PROGRESS: 'In Progress',
      PENDING: 'Pending',
    };
    return map[status] ?? status;
  }
}