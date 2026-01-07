import { DashboardTransactionModel } from './dashboard.models';

export class TransactionsData {
  public static data: DashboardTransactionModel[] = [
    {
      id: 'TXN001',
      date: '2025-12-07',
      vehicle: 'KAB 123X',
      amount: 5500,
      type: 'Payment',
      status: 'Completed',
    },
    {
      id: 'TXN002',
      date: '2025-12-07',
      vehicle: 'KBC 456Y',
      amount: 4200,
      type: 'Booking',
      status: 'Pending',
    },
    {
      id: 'TXN003',
      date: '2025-12-06',
      vehicle: 'KCD 789Z',
      amount: 6800,
      type: 'Payment',
      status: 'Completed',
    },
  ];
}
