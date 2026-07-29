// @core/models/wallet/organization-balance.model.ts

/** Generic envelope every payment/balance endpoint responds with. */
export interface ApiEnvelope<T> {
  data: T;
  message: string;
  code: number;
}

/** Response from POST /payment/balance/query(/:partyA) — initiates an async lookup. */
export interface BalanceQueryInit {
  status: 'QUEUED' | string;
  partyA: string;
  originatorConversationId: string;
  conversationId: string;
}

export interface SubAccount {
  name: string;
  balance: number;
  available: number | null;
  reserved: number | null;
  uncleared: number | null;
}

/** A single resolved (or in-flight) balance record — shape of /latest and each item in /history. */
export interface BalanceRecord {
  partyA: string;
  conversationId: string;
  originatorConversationId: string;
  transactionId: string | null;
  resultCode: number | null;
  resultType: number | null;
  resultDesc: string | null;
  status: 'SUCCESS' | 'PENDING' | 'QUEUED' | 'FAILED' | string;
  totalBalance: number | null;
  workingAccount: SubAccount | null;
  utilityAccount: SubAccount | null;
  chargesPaidAccount: SubAccount | null;
  merchantAccount: SubAccount | null;
  settlementAccount: SubAccount | null;
  currency: string;
  boCompletedTime: string | null;
  recordedAt: string;
  success: boolean;
}

/** Response from GET /payment/balance/:partyA/check?amount=X */
export interface BalanceSufficiency {
  sufficient: boolean;
  requiredAmount: number;
  availableBalance: number;
  shortfall: number;
  currency: string;
  partyA: string;
  checkedAt: string;
  message: string;
}

export type BalanceQueryResponse = ApiEnvelope<BalanceQueryInit>;
export type BalanceLatestResponse = ApiEnvelope<BalanceRecord>;
export type BalanceHistoryResponse = ApiEnvelope<BalanceRecord[]>;
export type BalanceCheckResponse = ApiEnvelope<BalanceSufficiency>;
