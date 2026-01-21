import { Wallet } from "./wallet.model";

export interface WalletApiResponse {
  data: {
    walletDetails: Wallet[];   // Array of wallet objects
  };
  message: string;             // Response message (e.g., "success!")
  code: number;                // Response code (e.g., 0 for success)
}
