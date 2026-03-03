// services/booking-conflict.service.ts
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import {
  Trip,
  TripTransaction,
  SeatReservation,
  SeatConflict,
  ConflictType,
  TripsApiResponse,
  TransactionsApiResponse,
  ReservationsApiResponse,
} from '../models/booking/booking-conflict.model';
import { AppNotificationService } from './app-notification.service';
import { DataService } from '../api/data.service';
import { API_ENDPOINTS } from '../api/endpoints';

@Injectable({ providedIn: 'root' })
export class BookingConflictService {
  /** In-memory store of all detected conflicts for the current session */
  private detectedConflicts: SeatConflict[] = [];

  constructor(
    private dataService: DataService,
    private notificationService: AppNotificationService
  ) { }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Run a full conflict scan for all trips matching the given filters.
   * Fetches trips → then for each trip fetches transactions + reservations
   * → analyses for conflicts → pushes notifications for any new ones found.
   *
   * @param entityId    Your entity identifier
   * @param tripStatus  Trip status filter (default: IN_PROGRESS)
   * @param fleetNumber Optional fleet filter
   */
  scanForConflicts(
    entityId: string,
    tripStatus: string = 'IN_PROGRESS',
    fleetNumber?: string
  ): Observable<SeatConflict[]> {
    return this.fetchTrips(entityId, tripStatus, fleetNumber).pipe(
      switchMap(trips => {
        if (!trips.length) return of([]);

        // For each trip, fetch transactions + reservations in parallel
        const tripAnalyses$ = trips.map(trip => this.analyseTrip(trip, entityId));

        return forkJoin(tripAnalyses$).pipe(
          map(results => {
            const allConflicts = results.flat();
            this.processNewConflicts(allConflicts);
            return allConflicts;
          })
        );
      }),
      catchError(err => {
        console.error('[BookingConflictService] scan failed:', err);
        return of([]);
      })
    );
  }

  /**
   * Analyse a single trip and return any conflicts found.
   * Useful for checking one specific trip on demand.
   */
  analyseTrip(trip: Trip, entityId: string): Observable<SeatConflict[]> {
    return forkJoin({
      transactions: this.fetchTransactions(trip.tripId),
      reservations: this.fetchReservations(trip.tripId, entityId),
    }).pipe(
      map(({ transactions, reservations }) =>
        this.detectConflicts(trip, transactions, reservations)
      ),
      catchError(err => {
        console.error(`[BookingConflictService] analyseTrip(${trip.tripId}) failed:`, err);
        return of([]);
      })
    );
  }

  /** Return all conflicts detected so far */
  getAllConflicts(): SeatConflict[] {
    return [...this.detectedConflicts];
  }

  /** Return only unresolved conflicts */
  getUnresolvedConflicts(): SeatConflict[] {
    return this.detectedConflicts.filter(c => !c.resolved);
  }

  /** Mark a conflict as resolved */
  resolveConflict(conflictId: string): void {
    const conflict = this.detectedConflicts.find(c => c.conflictId === conflictId);
    if (conflict) conflict.resolved = true;
  }

  /** Clear all stored conflicts */
  clearConflicts(): void {
    this.detectedConflicts = [];
  }

  // ── Core Detection Logic ───────────────────────────────────────────────────

  detectConflicts(
    trip: Trip,
    transactions: TripTransaction[],
    reservations: SeatReservation[]
  ): SeatConflict[] {
    const completedReservations = reservations.filter(r => r.reservationStatus === 'COMPLETED');

    return [
      ...this.detectDoubleBookings(trip, completedReservations),
      ...this.detectOverCapacity(trip, completedReservations),
      ...this.detectOrphanTransactions(trip, transactions, completedReservations),
      ...this.detectOrphanReservations(trip, transactions, completedReservations),
    ];
  }

  // ── Private Detection Methods ──────────────────────────────────────────────

  private detectDoubleBookings(trip: Trip, reservations: SeatReservation[]): SeatConflict[] {
    const seatToPassengers = new Map<number, string[]>();

    for (const reservation of reservations) {
      for (const seat of reservation.seatNumbers) {
        const existing = seatToPassengers.get(seat) ?? [];
        existing.push(reservation.username);
        seatToPassengers.set(seat, existing);
      }
    }

    const doubleBookedSeats: number[] = [];
    const allAffectedPassengers = new Set<string>();

    seatToPassengers.forEach((passengers, seat) => {
      if (passengers.length > 1) {
        doubleBookedSeats.push(seat);
        passengers.forEach(p => allAffectedPassengers.add(p));
      }
    });

    if (doubleBookedSeats.length === 0) return [];

    return [{
      conflictId: `double_${trip.tripId}_${doubleBookedSeats.sort().join('_')}`,
      type: 'DOUBLE_BOOKING',
      severity: 'HIGH',
      tripId: trip.tripId,
      fleetNumber: trip.fleetNumber,
      routeName: trip.routeName,
      travelDate: trip.travelDate,
      description: `Double booking detected on seat(s) ${doubleBookedSeats.join(', ')} — ` +
        `${allAffectedPassengers.size} passengers affected on trip #${trip.tripId} (${trip.fleetNumber}).`,
      affectedSeats: doubleBookedSeats,
      affectedPassengers: Array.from(allAffectedPassengers),
      detectedAt: new Date(),
      resolved: false,
    }];
  }

  private detectOverCapacity(trip: Trip, reservations: SeatReservation[]): SeatConflict[] {
    const totalReservedSeats = reservations.reduce((sum, r) => sum + r.seatNumbers.length, 0);

    if (totalReservedSeats <= trip.capacity) return [];

    const excess = totalReservedSeats - trip.capacity;
    return [{
      conflictId: `overcap_${trip.tripId}`,
      type: 'OVER_CAPACITY',
      severity: 'HIGH',
      tripId: trip.tripId,
      fleetNumber: trip.fleetNumber,
      routeName: trip.routeName,
      travelDate: trip.travelDate,
      description: `Trip #${trip.tripId} (${trip.fleetNumber}) is over capacity: ` +
        `${totalReservedSeats} seats reserved but vehicle capacity is ${trip.capacity} (${excess} excess).`,
      detectedAt: new Date(),
      resolved: false,
    }];
  }

  private detectOrphanTransactions(
    trip: Trip,
    transactions: TripTransaction[],
    reservations: SeatReservation[]
  ): SeatConflict[] {
    const activeTxns = transactions.filter(t => t.status === 'STARTED' || t.status === 'COMPLETED');
    const reservedUsernames = new Set(reservations.map(r => r.username));

    return activeTxns
      .filter(t => !reservedUsernames.has(t.username))
      .map(orphan => ({
        conflictId: `orphan_txn_${trip.tripId}_${orphan.id}`,
        type: 'ORPHAN_TRANSACTION' as ConflictType,
        severity: 'MEDIUM' as const,
        tripId: trip.tripId,
        fleetNumber: trip.fleetNumber,
        routeName: trip.routeName,
        travelDate: trip.travelDate,
        description: `Trip #${trip.tripId}: transaction ${orphan.mpesaReceiptNumber} ` +
          `for ${orphan.customerName} (${orphan.phoneNumber}) has no matching seat reservation.`,
        affectedPassengers: [orphan.username],
        detectedAt: new Date(),
        resolved: false,
      }));
  }

  private detectOrphanReservations(
    trip: Trip,
    transactions: TripTransaction[],
    reservations: SeatReservation[]
  ): SeatConflict[] {
    const transactionUsernames = new Set(transactions.map(t => t.username));

    return reservations
      .filter(r => !transactionUsernames.has(r.username))
      .map(orphan => ({
        conflictId: `orphan_res_${trip.tripId}_${orphan.id}`,
        type: 'ORPHAN_RESERVATION' as ConflictType,
        severity: 'LOW' as const,
        tripId: trip.tripId,
        fleetNumber: trip.fleetNumber,
        routeName: trip.routeName,
        travelDate: trip.travelDate,
        description: `Trip #${trip.tripId}: seat reservation for ${orphan.username} ` +
          `(seats ${orphan.seatNumbers.join(', ')}) has no matching payment transaction.`,
        affectedSeats: orphan.seatNumbers,
        affectedPassengers: [orphan.username],
        detectedAt: new Date(),
        resolved: false,
      }));
  }

  // ── Notification Dispatch ──────────────────────────────────────────────────

  private processNewConflicts(conflicts: SeatConflict[]): void {
    const existingIds = new Set(this.detectedConflicts.map(c => c.conflictId));
    const newConflicts = conflicts.filter(c => !existingIds.has(c.conflictId));

    for (const conflict of newConflicts) {
      this.detectedConflicts.push(conflict);
      this.pushConflictNotification(conflict);
    }
  }

  private pushConflictNotification(conflict: SeatConflict): void {
    const typeToTitle: Record<ConflictType, string> = {
      DOUBLE_BOOKING: '⚠️ Double Booking Detected',
      OVER_CAPACITY: '🚨 Vehicle Over Capacity',
      ORPHAN_TRANSACTION: '💳 Unmatched Transaction',
      ORPHAN_RESERVATION: '🪑 Unmatched Reservation',
    };

    const severityToType: Record<'HIGH' | 'MEDIUM' | 'LOW', 'error' | 'warning' | 'info'> = {
      HIGH: 'error',
      MEDIUM: 'warning',
      LOW: 'info',
    };

    this.notificationService.push({
      id: `conflict_${conflict.conflictId}`,
      title: typeToTitle[conflict.type],
      message: conflict.description,
      type: severityToType[conflict.severity],
      metadata: {
        tripId: conflict.tripId,
        fleetNumber: conflict.fleetNumber,
        conflictType: conflict.type,
        affectedSeats: conflict.affectedSeats,
        affectedPassengers: conflict.affectedPassengers,
      },
    });
  }

  // ── Data fetching — using DataService to match app-wide fetching pattern ───

  private fetchTrips(
    entityId: string,
    tripStatus: string,
    fleetNumber?: string
  ): Observable<Trip[]> {
    const params: Record<string, string> = {
      entityId,
      tripStatus,
      page: '0',
      size: '100',
    };

    // Fleet number only sent when provided — mirrors your fetchTrips() logic
    if (fleetNumber?.trim()) {
      params['fleetNumber'] = fleetNumber.trim();
    }

    return this.dataService
      .get<TripsApiResponse>(API_ENDPOINTS.ALL_TRIPS, params, 'conflict-scan-trips', true)
      .pipe(
        map(res => (res.status === 0 ? res.data : [])),
        catchError(() => of([]))
      );
  }

  private fetchTransactions(tripId: number): Observable<TripTransaction[]> {
    // Mirrors your fetchTransactions(): GET TRIP_TRANSACTIONS/:tripId
    return this.dataService
      .get<TransactionsApiResponse>(
        `${API_ENDPOINTS.TRIP_TRANSACTIONS}/${tripId}`,
        { tripId },
        'conflict-scan-transactions',
        true
      )
      .pipe(
        map(res => (res.status === 0 ? res.data : [])),
        catchError(() => of([]))
      );
  }

  private fetchReservations(tripId: number, entityId: string): Observable<SeatReservation[]> {
    // No username/reservationStatus filter — fetch all reservations for the trip
    // Mirrors your fetchReservations() POST payload shape
    return this.dataService
      .post<ReservationsApiResponse>(
        API_ENDPOINTS.SEAT_RESERVATIONS,
        { tripId, entityId },
        'conflict-scan-reservations',
        true
      )
      .pipe(
        map(res => (res.status === 0 ? res.data : [])),
        catchError(() => of([]))
      );
  }
}