import { TransactionStatsPerCategory } from '../../@core/models/dashboard/dashboard.models';

export class TransactionStatsStatsByCategoryData {
  public static data: TransactionStatsPerCategory[] = [
    {
      category: 'SYSTEM',
      totalAmount: 50.0,
    },
    {
      category: 'DRIVER',
      totalAmount: 50.0,
    },
    {
      category: 'SACCO',
      totalAmount: 50.0,
    },
    {
      category: 'OFFLOAD',
      totalAmount: 50.0,
    },
    {
      category: 'PASSENGER_WALLET',
      totalAmount: 50.0,
    },
    {
      category: null,
      totalAmount: 50.0,
    },
  ];
}
