import { TransactionStatsData } from './dashboard.transactionStats.data';
import { TransactionStatsStatsByPeriodData } from './dashboard.transactionStatsByPeriod.data';
import { TransactionStatsStatsByCategoryData } from './dashboard.transactionStatsPerCategory.data';
import { PaymentRecordsData } from './dashboard.paymentRecord.data';
import { DashboardData } from '../../@core/models/dashboard/dashboard.models';

export class DashboardFakeData {
  public static data: DashboardData = {
    summary: TransactionStatsData.data,
    daily: TransactionStatsStatsByPeriodData.data,
    categories: TransactionStatsStatsByCategoryData.data,
    recentTransactions: PaymentRecordsData.response,
  };
}
