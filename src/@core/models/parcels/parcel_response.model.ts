import { Parcel } from "./parcel.model";


export interface ParcelsResponse {
  parcels: Parcel[];
  aggregates: Record<string, unknown> | null;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  totalAmount: number;
  totalCash: number;
  totalCashLess: number;
  totalExpenses: number;
  netAmount: number;
}
