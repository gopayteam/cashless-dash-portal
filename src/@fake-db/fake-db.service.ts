import { InMemoryDbService } from 'angular-in-memory-web-api';
import { DashboardFakeData } from './dashboard/dashboard.data';

export class FakeDbService implements InMemoryDbService {
  createDb() {
    return {
      // Dashboard
      dashboard: DashboardFakeData.data,

      recent_transactions: DashboardFakeData.data.recentTransactions,
      transaction_stats: DashboardFakeData.data.transaction_stats,
      transaction_stats_by_period: DashboardFakeData.data.transaction_stats_by_period,
      transaction_stats_per_category: DashboardFakeData.data.transaction_stats_per_category,

    };
  }
}
