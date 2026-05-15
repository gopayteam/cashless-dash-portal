// @core/models/forecast/forecast.model.ts

export interface TransactionRecord {
  mpesaReceiptNumber: string;
  fleetNumber: string;
  assignedAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  transactionType: 'CREDIT' | 'DEBIT';
  createdAt: string; // ISO 8601
  currentDay: string;
}

export interface ForecastRequest {
  source: 'payload' | 'db' | 'file';
  transactions?: TransactionRecord[];
  vehicle_id?: string;
  periods: number;
  freq: 'D' | 'W' | 'MS';
  models?: string[];
  start_date?: string;
  end_date?: string;
  date_column?: string;
  value_column?: string;
  use_cache?: boolean;
  file_id?: string;
}

export interface ForecastMetrics {
  [key: string]: number;
}

export interface ForecastResponse {
  job_id: string;
  status: 'completed' | 'processing' | 'failed';
  plotly_json: any; // Direct Plotly figure object
  metrics: ForecastMetrics;
  ensemble: any[];
  error?: string;
}

export interface ModelOption {
  label: string;
  value: string;
  description: string;
}

export const FORECAST_MODELS: ModelOption[] = [
  { label: 'ARIMA', value: 'arima', description: 'Auto-Regressive Integrated Moving Average' },
  { label: 'SARIMA', value: 'sarima', description: 'Seasonal ARIMA' },
  { label: 'Prophet', value: 'prophet', description: 'Facebook Prophet (trend + seasonality)' },
  { label: 'Random Forest', value: 'random_forest', description: 'Ensemble tree-based model' },
  { label: 'Linear Regression', value: 'linear_regression', description: 'Baseline linear trend' },
];

export const FREQ_OPTIONS = [
  { label: 'Daily', value: 'D' },
  { label: 'Weekly', value: 'W' },
  { label: 'Monthly', value: 'MS' },
] as const;
