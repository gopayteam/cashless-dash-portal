import { TransactionStatsData } from './dashboard.transactionStats.data';
import { TransactionStatsStatsByPeriodData } from './dashboard.transactionStatsByPeriod.data';
import { TransactionStatsStatsByCategoryData } from './dashboard.transactionStatsPerCategory.data';
import { PaymentRecordsData } from './dashboard.paymentRecord.data';
import { DashboardData } from '../../@core/models/dashboard/dashboard.models';

export class DashboardFakeData {
  public static data: DashboardData = {
    transaction_stats: TransactionStatsData.data,
    transaction_stats_by_period: TransactionStatsStatsByPeriodData.data,
    transaction_stats_per_category: TransactionStatsStatsByCategoryData.data,
    recentTransactions: PaymentRecordsData.response,
  };
}
