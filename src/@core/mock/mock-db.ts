import { DashboardFakeData } from '../../@fake-db/dashboard/dashboard.data';

export const MOCK_DB = {
  dashboard: DashboardFakeData.data,
  stats: DashboardFakeData.data.transaction_stats,
  stats_by_period: DashboardFakeData.data.transaction_stats_by_period,
  stats_per_category: DashboardFakeData.data.transaction_stats_per_category,
  recent_transactions: DashboardFakeData.data.recentTransactions,
};
