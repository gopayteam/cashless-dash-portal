// @core/models/parcels/stage-performance.model.ts

/**
 * One row of the stage performance report — aggregated totals for a
 * single parcel source stage over a given date range.
 */
export interface StagePerformance {
  stageId: number | null;
  stageName: string;
  parcelsProcessed: number;
  totalAmount: number;
  cashAmount: number;
  cashlessAmount: number;
  totalExpenses: number;
  netRevenue: number;
}

/**
 * Parameters used to fetch and compute a stage performance report.
 */
export interface StagePerformanceParams {
  entityId: string;
  startDate: Date;
  endDate: Date;
  /** Restrict the report to a single source stage. Omit/null for all stages. */
  sourceId?: number | null;
}
