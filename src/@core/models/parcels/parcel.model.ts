export interface Parcel {
  id: number;
  parcelNumber: string;
  entityId: string;
  username: string;
  senderName: string;
  receiverName: string;
  senderPhoneNumber: string;
  receiverPhoneNumber: string;
  sourceName: string;
  destinationName: string;
  parcelStatus: "IN_TRANSIT" | "DELIVERED" | "PENDING" | "CANCELLED"; // extend as needed
  paymentStatus: "PAID" | "UNPAID" | "PENDING"; // extend as needed
  paymentMethod: "CASH" | "CASHLESS" | "MPESA"; // extend as needed
  fleetNo: string;
  amount: number;
  dispatchedAt: string | null; // ISO date string
  arrivedAt: string | null;
  receivedBy: string | null;
  pickedAt: string | null;
  pickedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  description: string;
  value: string; // could be number if always numeric
  lastMile: string;
  expense: number | null;
  expenseDescription: string | null;
  serviceCharge: number;
  mpesaReceiptNumber: string | null;
}
