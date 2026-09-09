import { UserWalletItem } from "./user-wallet-item.model";


export interface UserWalletsAnalysisResponse {
  data: {
    items: UserWalletItem[];
    totalElements: number;
  };
  message: string;
  code: number;
}
