export interface DashboardStatsModel {
  totalAmountCollected: number;
  totalBookingAmount: number;
  totalDirectPayment: number;
  totalTransactions: number;
  changes: {
    totalAmountCollected: string;
    totalBookingAmount: string;
    totalDirectPayment: string;
    totalTransactions: string;
  };
}

export interface DashboardLineChartModel {
  labels: string[];
  data: number[];
}

export interface DashboardPieChartModel {
  labels: string[];
  data: number[];
}

export interface DashboardTransactionModel {
  id: string;
  date: string;
  vehicle: string;
  amount: number;
  type: 'Payment' | 'Booking';
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface DashboardDataModel {
  stats: DashboardStatsModel;
  lineChart: DashboardLineChartModel;
  pieChart: DashboardPieChartModel;
  recentTransactions: DashboardTransactionModel[];
}
