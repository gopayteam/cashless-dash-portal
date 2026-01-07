import { DashboardStatsModel } from './dashboard.models';

export class StatisticsData {
  public static data: DashboardStatsModel = {
    totalAmountCollected: 6999837,
    totalBookingAmount: 14565,
    totalDirectPayment: 6985272,
    totalTransactions: 42063,
    changes: {
      totalAmountCollected: '+12.5%',
      totalBookingAmount: '+8.2%',
      totalDirectPayment: '+15.3%',
      totalTransactions: '+23.1%',
    },
  };
}
