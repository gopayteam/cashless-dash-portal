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

export interface WithdrawalsCollectionsResponse {
  data: {
    totalAmountCollected: number;
    totalAmountWithdrawn: number;
  };
  message: string;
  code: number;
}

export interface WithdrawalsCollectionsView {
  totalCollections: number;
  totalWithdrawals: number;
  netFlow: number;
  period: string;
}
