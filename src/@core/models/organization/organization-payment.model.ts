export interface PaymentMethod {
  id: number;
  createdOn: string;
  createBy: string | null;
  lastModifiedDate: string | null;
  modifiedBy: string | null;
  softDelete: boolean;
  created: boolean;

  code: string;
  name: string;
  category: string;
  provider: string;
  status: PaymentMethodStatus;
}

export type OrganizationPayment = 'TILL' | 'PAYBILL' | 'WALLET';

export type PaymentMethodStatus = 'CREATED' | 'ACTIVE' | 'DISABLED';

