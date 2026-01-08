import { PaymentRecord } from './transactions.models';

export interface PaymentsApiResponse {
  data: {
    totalRecords: number;
    manifest: PaymentRecord[];
    pageSize: number;
    currentPage: number;
  };
  message: string;
  code: number;
}
