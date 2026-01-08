import {
  TransactionStats,
  TransactionStatsByPeriod,
  TransactionStatsPerCategory,
} from '../models/dashboard/dashboard.models';

export interface StatsCard {
  title: string;
  amount?: number;
  count?: number;
  currency?: string;
  icon: string;
  color: string;
  change?: string;
}

/**
 * Maps API stats to UI card format
 */
export function mapStatsToCards(stats: TransactionStats): StatsCard[] {
  return [
    {
      title: 'Total Amount Collected',
      amount: stats.totalAmountCredited,
      currency: 'Ksh',
      icon: 'pi-wallet',
      color: '#0d6efd',
    },
    {
      title: 'Total Booking Amount',
      amount: stats.totalBookingAmount,
      currency: 'Ksh',
      icon: 'pi-calendar',
      color: '#198754',
    },
    {
      title: 'Total Direct Payments',
      amount: stats.totalDirectPaymentAmount,
      currency: 'Ksh',
      icon: 'pi-money-bill',
      color: '#ffc107',
    },
    {
      title: 'Total Transactions',
      count: stats.totalTransactions,
      icon: 'pi-chart-line',
      color: '#dc3545',
    },
  ];
}

/**
 * Builds line chart data from API response
 */
export function buildLineChart(data: TransactionStatsByPeriod[]) {
  return {
    labels: data.map((d) => d.period),
    datasets: [
      {
        label: 'Daily Amount (Ksh)',
        data: data.map((d) => d.totalAmountCredited),
        fill: true,
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220,53,69,0.1)',
        tension: 0.4,
      },
    ],
  };
}

/**
 * Line chart options configuration
 */
export function buildLineChartOptions(): any {
  return {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Amount: Ksh ${context.parsed.y.toLocaleString('en-KE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return `Ksh ${(value / 1000).toFixed(0)}k`;
          },
        },
      },
    },
  };
}

/**
 * Builds pie chart data from API response
 */
export function buildPieChart(data: TransactionStatsPerCategory[]) {
  const filtered = data.filter((d) => d.category);

  return {
    labels: filtered.map((d) => d.category),
    datasets: [
      {
        data: filtered.map((d) => d.totalAmount),
        backgroundColor: ['#0d6efd', '#dc3545', '#ffc107', '#198754', '#6f42c1'],
      },
    ],
  };
}

/**
 * Pie chart options configuration
 */
export function buildPieChartOptions(): any {
  return {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false, // We're using custom legend
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: Ksh ${value.toLocaleString('en-KE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} (${percentage}%)`;
          },
        },
      },
    },
  };
}
