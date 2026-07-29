// @core/models/wallet/wallet-analytics.model.ts

export interface WalletBalanceItem {
  category: string;
  totalBalance: number;
}

export interface WalletBalanceSummaryResponse {
  data: {
    total: number;
    items: WalletBalanceItem[];
  };
  message: string;
  code: number;
}

export interface TillNumberTariffResponse {
  data: {
    tillNumberTariff: number;
  };
  message: string;
  code: number;
}

/**
 * STUB — the real withdrawals-collections response has not been shared yet.
 * This is a best-guess shape so the UI has something to bind to.
 * Once you share the actual payload, update this interface (and the
 * handler in wallet-analytics.component.ts) to match it exactly.
 */
export interface WithdrawalsCollectionsResponse {
  data: {
    totalWithdrawals: number;
    totalCollections: number;
    netFlow: number;
    period: string;
  };
  message: string;
  code: number;
}
