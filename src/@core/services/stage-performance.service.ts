// @core/services/stage-performance.service.ts
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { DataService } from '../api/data.service';
import { API_ENDPOINTS } from '../api/endpoints';
import { Stage } from '../models/locations/stage.model';
import { ParcelsAPiResponse } from '../models/parcels/parcel_response.model';
import { StagePerformance, StagePerformanceParams } from '../models/parcels/stage-performance.model';
import { formatDateLocal } from '../utils/date-time.util';

@Injectable({ providedIn: 'root' })
export class StagePerformanceService {

  constructor(private dataService: DataService) { }

  /**
   * Builds a per-stage performance report for the given date range.
   *
   * IMPORTANT: this trusts the backend's own aggregate fields
   * (totalItems / totalAmount / totalCash / totalCashLess / totalExpenses /
   * netAmount) on ParcelsAPiResponse rather than re-summing the returned
   * `parcels` array client-side. Those fields are query-scoped (they
   * already reflect entityId + date range + sourceId + paymentStatus),
   * so one request per stage with the aggregate fields read straight off
   * the response is both simpler and correct — no risk of missing data
   * that isn't fully present on every Parcel row (e.g. expenses), and no
   * risk of a page-size cap silently truncating the sum.
   *
   * When a single stage is selected, this fires one request. When "All
   * Stages" is selected, it fires one request per stage in parallel.
   */
  getStagePerformance(params: StagePerformanceParams, stages: Stage[]): Observable<StagePerformance[]> {
    const { entityId, startDate, endDate, sourceId } = params;

    const relevantStages = sourceId ? stages.filter(s => s.id === sourceId) : stages;

    if (relevantStages.length === 0) {
      return of([]);
    }

    const requests = relevantStages.map(stage =>
      this.fetchStageTotals(entityId, startDate, endDate, stage)
    );

    return forkJoin(requests);
  }

  private fetchStageTotals(entityId: string, startDate: Date, endDate: Date, stage: Stage): Observable<StagePerformance> {
    const payload: any = {
      entityId,
      page: 0,
      // We only need the response's aggregate fields, not the parcel rows
      // themselves — size stays small on purpose. If your backend computes
      // totalAmount/totalCash/totalCashLess/totalExpenses/netAmount only
      // over the returned page rather than the full filtered query, bump
      // this up (e.g. to match ALL_PARCELS' max page size) so those totals
      // stay accurate — worth a quick sanity check against a known stage.
      size: 1,
      paymentStatus: 'PAID',
      startDate: formatDateLocal(startDate),
      endDate: formatDateLocal(endDate),
      sort: 'createdAt,DESC',
      sourceId: stage.id,
    };

    return this.dataService
      .post<ParcelsAPiResponse>(API_ENDPOINTS.ALL_PARCELS, payload, `stage-performance-${stage.id}`, true)
      .pipe(
        map((response): StagePerformance => {
          const totalAmount = response.totalAmount ?? 0;
          const totalExpenses = response.totalExpenses ?? 0;

          return {
            stageId: stage.id,
            stageName: stage.name,
            parcelsProcessed: response.totalItems ?? 0,
            totalAmount,
            cashAmount: response.totalCash ?? 0,
            cashlessAmount: response.totalCashLess ?? 0,
            totalExpenses,
            // Prefer the backend's own netAmount when present; fall back to
            // amount - expenses only if it's missing.
            netRevenue: response.netAmount ?? (totalAmount - totalExpenses),
          };
        })
      );
  }
}




// // #############################################################################################
// // @core/services/stage-performance.service.ts
// import { Injectable } from '@angular/core';
// import { Observable, forkJoin, map, of } from 'rxjs';
// import { DataService } from '../api/data.service';
// import { API_ENDPOINTS } from '../api/endpoints';
// import { Stage } from '../models/locations/stage.model';
// import { ParcelsAPiResponse } from '../models/parcels/parcel_response.model';
// import { StagePerformance, StagePerformanceParams } from '../models/parcels/stage-performance.model';
// import { formatDateLocal } from '../utils/date-time.util';

// @Injectable({ providedIn: 'root' })
// export class StagePerformanceService {

//   constructor(private dataService: DataService) { }

//   /**
//    * Builds a per-stage performance report for the given date range.
//    *
//    * IMPORTANT: this trusts the backend's own aggregate fields
//    * (totalItems / totalAmount / totalCash / totalCashLess / totalExpenses /
//    * netAmount) on ParcelsAPiResponse rather than re-summing the returned
//    * `parcels` array client-side. Those fields are query-scoped (they
//    * already reflect entityId + date range + sourceId + paymentStatus),
//    * so one request per stage with the aggregate fields read straight off
//    * the response is both simpler and correct — no risk of missing data
//    * that isn't fully present on every Parcel row (e.g. expenses), and no
//    * risk of a page-size cap silently truncating the sum.
//    *
//    * When a single stage is selected, this fires one request. When "All
//    * Stages" is selected, it fires one request per stage in parallel.
//    */
//   getStagePerformance(params: StagePerformanceParams, stages: Stage[]): Observable<StagePerformance[]> {
//     const { entityId, startDate, endDate, sourceId } = params;

//     const relevantStages = sourceId ? stages.filter(s => s.id === sourceId) : stages;

//     if (relevantStages.length === 0) {
//       return of([]);
//     }

//     const requests = relevantStages.map(stage =>
//       this.fetchStageTotals(entityId, startDate, endDate, stage)
//     );

//     return forkJoin(requests);
//   }

//   private fetchStageTotals(entityId: string, startDate: Date, endDate: Date, stage: Stage): Observable<StagePerformance> {
//     const payload: any = {
//       entityId,
//       page: 0,
//       // We only need the response's aggregate fields, not the parcel rows
//       // themselves — size stays small on purpose. If your backend computes
//       // totalAmount/totalCash/totalCashLess/totalExpenses/netAmount only
//       // over the returned page rather than the full filtered query, bump
//       // this up (e.g. to match ALL_PARCELS' max page size) so those totals
//       // stay accurate — worth a quick sanity check against a known stage.
//       size: 1,
//       paymentStatus: 'PAID',
//       startDate: formatDateLocal(startDate),
//       endDate: formatDateLocal(endDate),
//       sort: 'createdAt,DESC',
//       sourceId: stage.id,
//     };

//     return this.dataService
//       .post<ParcelsAPiResponse>(API_ENDPOINTS.ALL_PARCELS, payload, `stage-performance-${stage.id}`, true)
//       .pipe(
//         map((response): StagePerformance => {
//           const totalAmount = response.totalAmount ?? 0;
//           const totalExpenses = response.totalExpenses ?? 0;

//           return {
//             stageId: stage.id,
//             stageName: stage.name,
//             parcelsProcessed: response.totalItems ?? 0,
//             totalAmount,
//             cashAmount: response.totalCash ?? 0,
//             cashlessAmount: response.totalCashLess ?? 0,
//             totalExpenses,
//             // Prefer the backend's own netAmount when present; fall back to
//             // amount - expenses only if it's missing.
//             netRevenue: response.netAmount ?? (totalAmount - totalExpenses),
//           };
//         })
//       );
//   }
// }
