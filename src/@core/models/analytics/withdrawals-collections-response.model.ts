
export interface WithdrawalsCollectionsResponse {
  data: {
    totalAmountCollected: number;
    totalAmountWithdrawn: number;
  };
  message: string;
  code: number;
}
