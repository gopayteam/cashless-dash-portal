// transaction-lookup.model.ts

export interface TransactionLookupDto {
  id: number;
  entityId: string;
  username: string;
  phoneNumber: string;
  customerName: string;
  fleetNumber: string;
  mpesaReceiptNumber: string;
  originatorConversationId: string;
  conversationId: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  paymentSource: string;
  paymentType: string;
  transactionType: string;
  resultCode: string;
  resultDesc: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PagedLookupResponse<T> {
  data: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface TransactionSearchFilters {
  entityId?: string | null;
  phoneNumber?: string | null;
  username?: string | null;
  fleetNumber?: string | null;
  transactionCode?: string | null;
  mpesaReceiptNumber?: string | null;
  amount?: number | null;
  amountFrom?: number | null;
  amountTo?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  paymentStatus?: string | null;
  paymentSource?: string | null;
  paymentType?: string | null;
  transactionType?: string | null;
  at?: string | null;
  toleranceMinutes?: number | null;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export interface TransactionSummaryDto {
  totalTransactionCount: number;
  successfulTransactionCount?: number;
  failedTransactionCount?: number;
  pendingTransactionCount?: number;
  uniqueUsers?: number;
  uniqueFleets?: number;
  totalAmount: number;
  averageTransactionAmount?: number;
  highestTransactionAmount?: number;
  lowestTransactionAmount?: number;
  firstTransactionDate?: string;
  mostRecentTransactionDate?: string;
  mostFrequentlyUsedVehicle?: string;
}

export interface GroupMetricDto {
  group: string;
  transactionCount: number;
  totalAmount: number;
  averageAmount?: number;
}

export interface AnalyticsResponseDto {
  summary: TransactionSummaryDto;
  byPaymentType?: GroupMetricDto[];
  byPaymentSource?: GroupMetricDto[];
  byTransactionType?: GroupMetricDto[];
}

export interface StatementDto {
  id: number;
  amount: number;
  balance_after: number;
  balance_before: number;
  category?: string;
  created_at: string;
  entity_id: string;
  mpesa_receipt_number: string;
  source_fleet?: string;
  transaction_type?: string;
  wallet_id?: string;
}

export interface StatementSearchFilters {
  receiptNumber?: string | null;
  entityId?: string | null;
  sourceFleet?: string | null;
  user?: string | null;
  amount?: number | null;
  time?: string | null;
  type?: string | null;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export interface ApiErrorResponse {
  message?: string;
  status?: string;
  code?: number;
  errors?: { [field: string]: string };
}

export interface ReconciliationResponse {
  transaction: TransactionLookupDto | null;
  transactionState: any | null;
  statement: StatementDto | null;
  transactionExists: boolean;
  stateExists: boolean;
  statementExists: boolean;
  transactionAmount: number | null;
  stateAmount: number | null;
  statementAmount: number | null;
  amountConsistent: boolean;
  entityIdConsistent: boolean;
  mpesaReceiptNumberConsistent: boolean;
}

// Allowed sort fields per the Transaction Lookup API
export type TransactionSortField =
  | 'createdAt'
  | 'transactionDate'
  | 'amount'
  | 'updatedAt'
  | 'fleetNumber'
  | 'paymentStatus';
