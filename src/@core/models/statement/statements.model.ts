export interface Statement {
  createdOn: string;            // Timestamp when transaction occurred
  balanceAfter: number;         // Balance after transaction
  balanceBefore: number;        // Balance before transaction
  sourceFleet: string;          // Fleet code/source
  transactionType: string;      // Transaction type (e.g., CREDIT, DEBIT)
  mpesaReceiptNumber: string;   // Mpesa receipt number
  walletId: string;             // Wallet ID associated with transaction
  amount: number;               // Transaction amount
  category: string;             // Category (e.g., DRIVER, OFFLOAD)
}
