import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataService } from '../api/data.service';
import { API_ENDPOINTS } from '../api/endpoints';
import { OtpLookupDto, OtpSearchFilters } from '../models/lookup/otp-lookup.model';
import { PagedLookupResponse } from '../models/lookup/transaction-lookup.model';

@Injectable({
  providedIn: 'root',
})
export class OtpLookupService {
  private _useDev = true;

  constructor(private dataService: DataService) {}

  public setUseDevUrl(useDev: boolean): void {
    this._useDev = useDev;
  }

  public getUseDevUrl(): boolean {
    return this._useDev;
  }

  private resolveUseDev(perCallOverride?: boolean): boolean {
    return perCallOverride !== undefined ? perCallOverride : this._useDev;
  }

  searchOtps(
    filters: OtpSearchFilters,
    useDev?: boolean
  ): Observable<PagedLookupResponse<OtpLookupDto>> {
    const params = this.cleanParams(filters);
    return this.dataService.get<PagedLookupResponse<OtpLookupDto>>(
      API_ENDPOINTS.OTP_LOOKUP_SEARCH,
      params,
      'otp-search',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  getOtpsByPhone(
    phoneNumber: string,
    params?: { page?: number; size?: number; sort?: string; direction?: string },
    useDev?: boolean
  ): Observable<PagedLookupResponse<OtpLookupDto>> {
    return this.dataService.get<PagedLookupResponse<OtpLookupDto>>(
      API_ENDPOINTS.OTP_LOOKUP_BY_PHONE(phoneNumber),
      this.cleanParams(params),
      'otp-by-phone',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  getLatestOtpByPhone(
    phoneNumber: string,
    useDev?: boolean
  ): Observable<OtpLookupDto> {
    return this.dataService.get<OtpLookupDto>(
      API_ENDPOINTS.OTP_LOOKUP_LATEST_BY_PHONE(phoneNumber),
      undefined,
      'otp-latest-by-phone',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  getOtpByRef(
    tokenRefId: string,
    useDev?: boolean
  ): Observable<OtpLookupDto> {
    return this.dataService.get<OtpLookupDto>(
      API_ENDPOINTS.OTP_LOOKUP_BY_REF(tokenRefId),
      undefined,
      'otp-by-ref',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  getOtpById(
    id: number | string,
    useDev?: boolean
  ): Observable<OtpLookupDto> {
    return this.dataService.get<OtpLookupDto>(
      API_ENDPOINTS.OTP_LOOKUP_BY_ID(id),
      undefined,
      'otp-by-id',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  private cleanParams(raw?: Record<string, any>): Record<string, any> {
    if (!raw) return {};
    return Object.fromEntries(
      Object.entries(raw).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      )
    );
  }
}
