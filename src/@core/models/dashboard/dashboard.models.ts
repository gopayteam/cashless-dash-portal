import { ParcelsAPiResponse } from '../parcels/parcel_response.model';
import { PaymentsApiResponse } from '../transactions/payment_reponse.model';

export interface TransactionStats {
  totalTransactions: number;
  totalAmountCredited: number;
  totalBookingAmount: number;
  totalDirectPaymentAmount: number;
}

export interface TransactionStatsByPeriod {
  period: string; // e.g. "2026-01-01"
  totalAmountCredited: number; // daily credited amount
}

export interface TransactionStatsPerCategory {
  category: 'SYSTEM' | 'DRIVER' | 'SACCO' | 'OFFLOAD' | 'PASSENGER_WALLET' | null;
  totalAmount: number;
}

export interface DashboardData {
  transaction_stats: TransactionStats;
  transaction_stats_by_period: TransactionStatsByPeriod[];
  transaction_stats_per_category: TransactionStatsPerCategory[];
  recentTransactions: PaymentsApiResponse;
}

export interface ParcelDashboardData {
  data: ParcelsAPiResponse;
}
