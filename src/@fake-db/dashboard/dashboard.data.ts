import { LineChartData } from './dashboard.linechart.data';
import { DashboardDataModel } from './dashboard.models';
import { PieChartData } from './dashboard.piechart.data';
import { StatisticsData } from './dashboard.statistics.data';
import { TransactionsData } from './dashboard.transaction.data';

export class DashboardFakeData {
  public static data: DashboardDataModel = {
    stats: StatisticsData.data,
    lineChart: LineChartData.data,
    pieChart: PieChartData.data,
    recentTransactions: TransactionsData.data,
  };
}
