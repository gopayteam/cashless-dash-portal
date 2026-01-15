export interface Wallet {
  walletId: string;       // Unique identifier for the wallet
  category: "PASSENGER_WALLET" | "CONDUCTOR" | "DRIVER" | "OFFLOAD" | "INVESTOR_WALLET" | "MARSHAL_WALLET";      // Type of wallet (PASSENGER_WALLET, CONDUCTOR, DRIVER, OFFLOAD, etc.)
  status: "ACTIVE" | "DORMANT";         // Current status (ACTIVE, DORMANT)
  balance: number;        // Current balance
  createdAt: string;      // ISO timestamp when wallet was created
  updatedAt: string;      // ISO timestamp when wallet was last updated
}

