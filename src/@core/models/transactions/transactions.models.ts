export interface PaymentRecord {
  mpesaReceiptNumber: string;
  dropOff?: string | null;
  pickup?: string | null;
  tripId?: string | null;
  pickupId?: string | null;
  activeDriverUsername?: string | null;
  customerName?: string | null;
  transactionType: 'CREDIT' | 'DEBIT';
  createdAt: string;
  currentDay: string;
  fleetNumber: string;
  dropId?: string | null;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  assignedAmount: number;
  updatedAt: string;
}

export interface PaymentRecordVM extends PaymentRecord {
  createdAtFormatted: string;
  updatedAtFormatted: string;
}
