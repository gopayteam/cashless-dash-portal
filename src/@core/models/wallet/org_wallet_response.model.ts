import { OrganizationWallet } from "./org_wallet.model";

export interface OrganizationWalletApiResponse {
  status: number;                 // Response status code (e.g., 0 for success)
  message: string;                // Response message (e.g., "Success")
  data: OrganizationWallet[];     // Array of organization wallet objects
}
