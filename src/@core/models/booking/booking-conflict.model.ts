// models/booking/booking-conflict.model.ts

export type ConflictType =
  | 'DOUBLE_BOOKING'
  | 'OVER_CAPACITY'
  | 'ORPHAN_TRANSACTION'
  | 'ORPHAN_RESERVATION';

export type TripStatus = 'COMPLETE' | 'PENDING' | 'IN_PROGRESS';

export interface SeatConflict {
  conflictId: string;
  type: ConflictType;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  tripId: number;
  fleetNumber: string;
  routeName: string;
  travelDate: string;

  /** The status of the trip at the time the conflict was detected */
  tripStatus: TripStatus | string;

  description: string;
  affectedSeats?: number[];
  affectedPassengers?: string[];
  detectedAt: Date;
  resolved: boolean;
}

// ── API response shapes ────────────────────────────────────────────────────

export interface Trip {
  tripId: number;
  fleetNumber: string;
  route: number;
  routeName: string;
  tripType: string;
  availableSeats: number;
  capacity: number;
  tripStatus: TripStatus | string;
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