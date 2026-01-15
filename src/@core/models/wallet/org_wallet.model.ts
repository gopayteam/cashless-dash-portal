export interface OrganizationWallet {
  id: number;               // Unique numeric ID
  entityId: string;         // Organization/entity ID
  walletId: string;         // Wallet ID (often same as entityId)
  category: string;         // Wallet category (PARCEL, SYSTEM, MANAGEMENT, OFFLOAD, DRIVER, etc.)
  balance: number;          // Current balance (can be positive or negative)
  status: string;           // Wallet status (e.g., ACTIVE)
  createdAt: string;        // ISO timestamp when wallet was created
  updatedAt: string;        // ISO timestamp when wallet was last updated
}
