import { Person } from "./person.model";

export interface DeletedParcel {
  id: number;
  softDelete: boolean;
  entityId: string;
  parcelNumber: string;

  sender: Person;
  receiver: Person;

  source: number;
  destination: number;
  via: number | null;

  parcelStatus: 'REGISTERED' | 'IN_TRANSIT' | 'ARRIVED';
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  fleetNo: string | null;

  created: boolean;
  amount: number;

  dispatchedAt: string | null;
  arrivedAt: string | null;
  receivedBy: string | null;
  pickedAt: string | null;
  pickedBy: string | null;

  createdAt: string;
  updatedAt: string | null;

  description: string;
  value: number | null;
  lastMile: number | null;
  expense: number | null;
  expenseDescription: string | null;

  serviceCharge: number;
  username: string;
  mpesaReceiptNumber: string | null;
  paymentMethod: 'CASH' | 'CASHLESS';
}
