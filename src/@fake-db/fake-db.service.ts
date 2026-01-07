import { InMemoryDbService } from 'angular-in-memory-web-api';
import { DashboardFakeData } from './dashboard/dashboard.data';

export class FakeDbService implements InMemoryDbService {
  createDb() {
    return {
      // Dashboard
      'dashboard': DashboardFakeData.data,

      // Future extensions
      // 'dashboard-transactions': DashboardFakeData.data.recentTransactions,
      // 'dashboard-line-chart': DashboardFakeData.data.lineChart,
      // 'dashboard-pie-chart': DashboardFakeData.data.pieChart,
    };
  }
}
