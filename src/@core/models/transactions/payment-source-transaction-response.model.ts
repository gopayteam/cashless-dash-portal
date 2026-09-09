
import { PaymentSourceTransaction } from './payment-source-transaction.model';

export interface PaymentSourceTransactionResponse {
  data: PaymentSourceTransaction[];
  message: string;
  code: number;
}
