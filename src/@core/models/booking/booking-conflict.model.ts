// models/booking-conflict.model.ts

export interface Trip {
  tripId: number;
  fleetNumber: string;
  route: number;
  routeName: string;
  tripType: string;
  availableSeats: number;
  capacity: number;
  tripStatus: string;
  travelDate: string;
  travelTime: string;
  tripAmount: string;
}

export interface TripTransaction {
  id: number;
  softDelete: boolean;
  entityId: string;
  mpesaReceiptNumber: string;
  fleetNumber: string;
  tripId: number;
  numberOfSeats: number;
  pickupId: number;
  dropOffId: number;
  customerName: string;
  phoneNumber: string;
  username: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  boardNumber: string;
  paymentSource: string | null;
}

export interface SeatReservation {
  id: number;
  softDelete: boolean;
  entityId: string;
  username: string;
  tripId: number;
  seatsReserved: number;
  reservationStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  seatNumbers: number[];
}

// ─── Conflict Types ───────────────────────────────────────────────────────────

export type ConflictType =
  | 'DOUBLE_BOOKING'       // Same seat assigned to 2+ passengers
  | 'OVER_CAPACITY'        // Total reservations exceed vehicle capacity
  | 'ORPHAN_TRANSACTION'   // Transaction exists but no matching reservation
  | 'ORPHAN_RESERVATION';  // Reservation exists but no matching transaction

export interface SeatConflict {
  conflictId: string;         // unique id for deduplication
  type: ConflictType;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  tripId: number;
  fleetNumber: string;
  routeName: string;
  travelDate: string;
  description: string;
  affectedSeats?: number[];
  affectedPassengers?: string[];
  detectedAt: Date;
  resolved: boolean;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface TripsApiResponse {
  status: number;
  message: string;
  data: Trip[];
  totalRecords: number;
}

export interface TransactionsApiResponse {
  status: number;
  message: string;
  data: TripTransaction[];
  totalRecords: number;
}

export interface ReservationsApiResponse {
  status: number;
  message: string;
  data: SeatReservation[];
  totalRecords: number;
}