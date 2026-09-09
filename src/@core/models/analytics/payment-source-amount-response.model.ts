
import { PaymentSourceAmount } from './payment-source-amount.model';

export interface PaymentSourceAmountResponse {
  data: PaymentSourceAmount;
  message: string;
  code: number;
}
