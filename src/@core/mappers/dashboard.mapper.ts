// @core/mappers/dashboard.mapper.ts
import {
  DashboardStatsModel,
  DashboardLineChartModel,
  DashboardPieChartModel,
} from '../../@fake-db/dashboard/dashboard.models';

export interface StatsCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  change?: string;
}

/**
 * Maps API stats to UI card format
 */
export function mapStatsToCards(stats: DashboardStatsModel): StatsCard[] {
  return [
    {
      title: 'Total Amount Collected',
      value: `Ksh ${stats.totalAmountCollected.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: 'pi-wallet',
      color: '#0d6efd',
      change: stats.changes.totalAmountCollected,
    },
    {
      title: 'Total Booking Amount',
      value: `Ksh ${stats.totalBookingAmount.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: 'pi-calendar',
      color: '#198754',
      change: stats.changes.totalBookingAmount,
    },
    {
      title: 'Total Direct Payment',
      value: `Ksh ${stats.totalDirectPayment.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: 'pi-money-bill',
      color: '#ffc107',
      change: stats.changes.totalDirectPayment,
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions.toLocaleString('en-KE'),
      icon: 'pi-chart-line',
      color: '#dc3545',
      change: stats.changes.totalTransactions,
    },
  ];
}

/**
 * Builds line chart data from API response
 */
export function buildLineChart(lineChart: DashboardLineChartModel): any {
  return {
    labels: lineChart.labels,
    datasets: [
      {
        label: 'Amount (Ksh)',
        data: lineChart.data,
        // fill: false,
        // borderColor: '#0d6efd',
        // backgroundColor: '#0d6efd',
        fill: true,
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
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
export function buildPieChart(pieChart: DashboardPieChartModel): any {
  return {
    labels: pieChart.labels,
    datasets: [
      {
        data: pieChart.data,
        backgroundColor: ['#0d6efd', '#dc3545', '#ffc107', '#198754'],
        hoverBackgroundColor: ['#0b5ed7', '#bb2d3b', '#ffca2c', '#157347'],
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
