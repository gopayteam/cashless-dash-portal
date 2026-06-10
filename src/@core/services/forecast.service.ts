// @core/services/forecast.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataService } from '../api/data.service';
import { API_ENDPOINTS } from '../api/endpoints';
import { ForecastRequest, ForecastResponse } from '../models/forecast/forecast.models';

@Injectable({ providedIn: 'root' })
export class ForecastService {
  uploadFile(formData: FormData): Observable<any> {
    return this.dataService.post<any>(
      API_ENDPOINTS.FORECAST_VEHICLE,
      formData,
      'forecast-data',
      false,
      true,
    );
  }
  constructor(private dataService: DataService) { }

  /**
   * POST /api/v1/forecast/vehicle
   * Sends transaction payload + config and returns the ensemble forecast.
   */
  postForecast(request: ForecastRequest): Observable<ForecastResponse> {
    return this.dataService.post<ForecastResponse>(
      API_ENDPOINTS.FORECAST_VEHICLE,
      request,
      'forecast',
      false,
      true,
    );
  }

  /**
   * GET /api/v1/forecast/job/{job_id}
   * Poll a pending job by its ID.
   */
  pollJob(jobId: string): Observable<ForecastResponse> {
    return this.dataService.get<ForecastResponse>(
      `${API_ENDPOINTS.FORECAST_JOB}/${jobId}`,
      {},
      'forecast-job',
      false,
      true,
    );
  }
}
