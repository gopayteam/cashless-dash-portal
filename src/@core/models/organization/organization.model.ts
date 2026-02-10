import { OrganizationCategoryFee } from "./organization-fees.model";
import { OrganizationPayment, PaymentMethod } from "./organization-payment.model";

export interface Organization {
  id: number;
  createdOn: string;
  createBy: string | null;
  lastModifiedDate: string | null;
  modifiedBy: string | null;
  softDelete: boolean;
  created: boolean;

  entityId: string;
  registrationNumber: string;
  name: string;
  telephone: string;
  emailAddress: string;
  physicalAddress: string;
  website: string;
  countryCode: string;
  country: string;
  mainOfficeLocation: string;
  officeLatitude: number;
  officeLongitude: number;
  status: OrganizationStatus;
  organizationPrefix: string;

  canAllowPointsReward: boolean;
  driverNotification: boolean;
  customerNotification: boolean;
  hasMultipleTills: boolean;
  hasServiceCharge: boolean;

  storeNumber: string;
  tillNumber: string;
  walletNumber: string;
  serviceChargeAmount: number;

  onboardingMethod: OnboardingMethod;
  organizationPayment: OrganizationPayment;

  paymentMethods: PaymentMethod[];
  organizationCategoryFees: OrganizationCategoryFee[];
}

export type OrganizationStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type OnboardingMethod = 'ADMIN' | 'SELF';

export interface OrganizationSummary {
  id: number;
  name: string;
  entityId: string;
  status: OrganizationStatus;
  country: string;
  paymentType: OrganizationPayment;
  totalFees: number;
}
