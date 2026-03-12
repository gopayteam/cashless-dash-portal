// models/eda/vehicle-analysis.model.ts

import { PaymentRecord } from "../transactions/transactions.models";


// ─────────────────────────────────────────────
// Request types (sent to gateway → EDA module)
// ─────────────────────────────────────────────

export interface VehicleAnalysisBaseRequest {
  entityId: string;
  fleetNumbers: string[];          // 1–5 fleet numbers
  transactions?: PaymentRecord[];  // Optional: send client-fetched data directly
}

export interface DayAnalysisRequest extends VehicleAnalysisBaseRequest {
  date: string;                    // YYYY-MM-DD
}

export interface WeekAnalysisRequest extends VehicleAnalysisBaseRequest {
  weekStart: string;               // Monday date YYYY-MM-DD
}

export interface MonthAnalysisRequest extends VehicleAnalysisBaseRequest {
  year: number;
  month: number;                   // 1–12
}

export interface YearAnalysisRequest extends VehicleAnalysisBaseRequest {
  year: number;
}

// ─────────────────────────────────────────────
// Response types (from EDA module)
// ─────────────────────────────────────────────

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface FleetSummary {
  fleetNumber: string;
  totalRevenue: number;
  totalTrips: number;
  paidTrips: number;
  pendingTrips: number;
  failedTrips: number;
  averagePerTrip: number;
  peakPeriod?: string;
}

export type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';
export type DataSource = 'payload' | 'database' | 'api' | 'csv' | 'none';

export interface VehicleAnalysisResponse {
  period: string;
  periodType: PeriodType;
  fleetSummaries: FleetSummary[];
  earningsChart: ChartData;       // Line chart
  tripsChart: ChartData;          // Bar chart
  paymentStatusChart: ChartData;  // Doughnut chart
  comparisonChart?: ChartData;    // Scatter (multi-fleet only)
  totalRevenue: number;
  totalTrips: number;
  dataSource: DataSource;
}

// ─────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────

export interface AnalysisTab {
  label: string;
  icon: string;
  periodType: PeriodType;
}

export const ANALYSIS_TABS: AnalysisTab[] = [
  { label: 'Day', icon: 'pi-sun', periodType: 'day' },
  { label: 'Week', icon: 'pi-calendar', periodType: 'week' },
  { label: 'Month', icon: 'pi-chart-bar', periodType: 'month' },
  { label: 'Year', icon: 'pi-chart-line', periodType: 'year' },
];
