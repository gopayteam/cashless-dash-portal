export interface OrganizationCategoryFee {
  id: number;
  categoryName: string;
  feeAmount: number;
  priority: number;
  createdOn: string;
  created: boolean;
  softDelete: boolean;
}

export type OrganizationFeeMap = Record<string, OrganizationCategoryFee>;
