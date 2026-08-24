import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataService } from '../api/data.service';
import { API_ENDPOINTS } from '../api/endpoints';
import {
  AnalyticsResponseDto,
  GroupMetricDto,
  PagedLookupResponse,
  ReconciliationResponse,
  StatementDto,
  StatementSearchFilters,
  TransactionLookupDto,
  TransactionSearchFilters,
  TransactionSummaryDto,
} from '../models/lookup/transaction-lookup.model';

@Injectable({
  providedIn: 'root',
})
export class TransactionLookupService {
  /**
   * Service-scoped flag: when true, only THIS service's calls
   * are routed to the dev API. Other services are unaffected.
   */
  private _useDev = true;

  constructor(private dataService: DataService) { }

  /**
   * Toggle whether THIS service's calls use the dev API URL.
   * This does NOT affect any other service in the application.
   */
  public setUseDevUrl(useDev: boolean): void {
    this._useDev = useDev;
  }

  /**
   * Returns whether this service is currently configured to use the dev API URL.
   */
  public getUseDevUrl(): boolean {
    return this._useDev;
  }

  /**
   * Resolves the effective useDev flag for a single call.
   * A per-call override wins; otherwise falls back to the service-level flag.
   */
  private resolveUseDev(perCallOverride?: boolean): boolean {
    return perCallOverride !== undefined ? perCallOverride : this._useDev;
  }

  /**
   * 1. GET /api/transactions/search
   * Flexible paged transaction search
   */
  searchTransactions(
    filters: TransactionSearchFilters,
    useDev?: boolean
  ): Observable<PagedLookupResponse<TransactionLookupDto>> {
    const params = this.cleanParams(filters);
    return this.dataService.get<PagedLookupResponse<TransactionLookupDto>>(
      API_ENDPOINTS.TRANSACTIONS_SEARCH,
      params,
      'transactions-search',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 2. GET /api/transactions/code/{transactionCode}
   * Lookup by the transaction identifier (M-Pesa receipt in verified migration schema)
   */
  getTransactionByCode(
    transactionCode: string,
    useDev?: boolean
  ): Observable<PagedLookupResponse<TransactionLookupDto>> {
    return this.dataService.get<PagedLookupResponse<TransactionLookupDto>>(
      API_ENDPOINTS.TRANSACTIONS_BY_CODE(transactionCode),
      undefined,
      'transactions-by-code',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 3. GET /api/transactions/receipt/{receiptNumber}
   * Lookup by M-Pesa receipt
   */
  getTransactionByReceipt(
    receiptNumber: string,
    useDev?: boolean
  ): Observable<PagedLookupResponse<TransactionLookupDto>> {
    return this.dataService.get<PagedLookupResponse<TransactionLookupDto>>(
      API_ENDPOINTS.TRANSACTIONS_BY_RECEIPT(receiptNumber),
      undefined,
      'transactions-by-receipt',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 4. GET /api/transactions/entity/{entityId}
   * Entity transaction history
   */
  getTransactionsByEntity(
    entityId: string,
    params?: { page?: number; size?: number; sort?: string; direction?: string },
    useDev?: boolean
  ): Observable<PagedLookupResponse<TransactionLookupDto>> {
    return this.dataService.get<PagedLookupResponse<TransactionLookupDto>>(
      API_ENDPOINTS.TRANSACTIONS_BY_ENTITY(entityId),
      this.cleanParams(params),
      'transactions-by-entity',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 5. GET /api/transactions/user/{phoneNumber}
   * User transaction history
   */
  getTransactionsByUser(
    phoneNumber: string,
    params?: { page?: number; size?: number; sort?: string; direction?: string },
    useDev?: boolean
  ): Observable<PagedLookupResponse<TransactionLookupDto>> {
    return this.dataService.get<PagedLookupResponse<TransactionLookupDto>>(
      API_ENDPOINTS.TRANSACTIONS_BY_USER(phoneNumber),
      this.cleanParams(params),
      'transactions-by-user',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 6. GET /api/transactions/fleet/{fleetNumber}
   * Vehicle transaction history
   */
  getTransactionsByFleet(
    fleetNumber: string,
    params?: { page?: number; size?: number; sort?: string; direction?: string },
    useDev?: boolean
  ): Observable<PagedLookupResponse<TransactionLookupDto>> {
    return this.dataService.get<PagedLookupResponse<TransactionLookupDto>>(
      API_ENDPOINTS.TRANSACTIONS_BY_FLEET(fleetNumber),
      this.cleanParams(params),
      'transactions-by-fleet',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 7. GET /api/transactions/{transactionCode}/reconciliation
   * Transaction / state / statement reconciliation
   */
  getReconciliation(
    transactionCode: string,
    useDev?: boolean
  ): Observable<ReconciliationResponse> {
    return this.dataService.get<ReconciliationResponse>(
      API_ENDPOINTS.TRANSACTION_RECONCILIATION(transactionCode),
      undefined,
      'transaction-reconciliation',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 8. GET /api/transactions/analytics/summary
   * Aggregate plus payment-type/source/type splits
   */
  getAnalyticsSummary(useDev?: boolean): Observable<AnalyticsResponseDto> {
    return this.dataService.get<AnalyticsResponseDto>(
      API_ENDPOINTS.TRANSACTIONS_ANALYTICS_SUMMARY,
      undefined,
      'analytics-summary',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 9. GET /api/transactions/analytics/daily
   * Daily totals
   */
  getAnalyticsDaily(useDev?: boolean): Observable<GroupMetricDto[]> {
    return this.dataService.get<GroupMetricDto[]>(
      API_ENDPOINTS.TRANSACTIONS_ANALYTICS_DAILY,
      undefined,
      'analytics-daily',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 10. GET /api/transactions/analytics/hourly
   * Hourly totals
   */
  getAnalyticsHourly(useDev?: boolean): Observable<GroupMetricDto[]> {
    return this.dataService.get<GroupMetricDto[]>(
      API_ENDPOINTS.TRANSACTIONS_ANALYTICS_HOURLY,
      undefined,
      'analytics-hourly',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 11. GET /api/users/{phoneNumber}/transactions
   * User history
   */
  getUserTransactions(
    phoneNumber: string,
    params?: { page?: number; size?: number; sort?: string; direction?: string },
    useDev?: boolean
  ): Observable<PagedLookupResponse<TransactionLookupDto>> {
    return this.dataService.get<PagedLookupResponse<TransactionLookupDto>>(
      API_ENDPOINTS.USER_TRANSACTIONS(phoneNumber),
      this.cleanParams(params),
      'user-transactions',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 12. GET /api/users/{phoneNumber}/transactions/summary
   * User summary
   */
  getUserSummary(
    phoneNumber: string,
    useDev?: boolean
  ): Observable<TransactionSummaryDto> {
    return this.dataService.get<TransactionSummaryDto>(
      API_ENDPOINTS.USER_TRANSACTIONS_SUMMARY(phoneNumber),
      undefined,
      'user-transactions-summary',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 13. GET /api/users/{phoneNumber}/analytics
   * User analytics
   */
  getUserAnalytics(
    phoneNumber: string,
    useDev?: boolean
  ): Observable<AnalyticsResponseDto> {
    return this.dataService.get<AnalyticsResponseDto>(
      API_ENDPOINTS.USER_ANALYTICS(phoneNumber),
      undefined,
      'user-analytics',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 14. GET /api/fleets/{fleetNumber}/transactions
   * Fleet history
   */
  getFleetTransactions(
    fleetNumber: string,
    params?: { page?: number; size?: number; sort?: string; direction?: string },
    useDev?: boolean
  ): Observable<PagedLookupResponse<TransactionLookupDto>> {
    return this.dataService.get<PagedLookupResponse<TransactionLookupDto>>(
      API_ENDPOINTS.FLEET_TRANSACTIONS(fleetNumber),
      this.cleanParams(params),
      'fleet-transactions',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 15. GET /api/fleets/{fleetNumber}/transactions/summary
   * Fleet summary
   */
  getFleetSummary(
    fleetNumber: string,
    useDev?: boolean
  ): Observable<TransactionSummaryDto> {
    return this.dataService.get<TransactionSummaryDto>(
      API_ENDPOINTS.FLEET_TRANSACTIONS_SUMMARY(fleetNumber),
      undefined,
      'fleet-transactions-summary',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 16. GET /api/fleets/{fleetNumber}/analytics
   * Fleet analytics
   */
  getFleetAnalytics(
    fleetNumber: string,
    useDev?: boolean
  ): Observable<AnalyticsResponseDto> {
    return this.dataService.get<AnalyticsResponseDto>(
      API_ENDPOINTS.FLEET_ANALYTICS(fleetNumber),
      undefined,
      'fleet-analytics',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 17. GET /api/statements/search
   * Paged statement search
   */
  searchStatements(
    filters: StatementSearchFilters,
    useDev?: boolean
  ): Observable<PagedLookupResponse<StatementDto>> {
    const params = this.cleanParams(filters);
    return this.dataService.get<PagedLookupResponse<StatementDto>>(
      API_ENDPOINTS.STATEMENTS_SEARCH,
      params,
      'statements-search',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 18. GET /api/statements/receipt/{receiptNumber}
   * Statement by receipt
   */
  getStatementByReceipt(
    receiptNumber: string,
    useDev?: boolean
  ): Observable<StatementDto> {
    return this.dataService.get<StatementDto>(
      API_ENDPOINTS.STATEMENTS_BY_RECEIPT(receiptNumber),
      undefined,
      'statement-by-receipt',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * 19. GET /api/statements/entity/{entityId}
   * Statement by entity
   */
  getStatementByEntity(
    entityId: string,
    useDev?: boolean
  ): Observable<PagedLookupResponse<StatementDto>> {
    return this.dataService.get<PagedLookupResponse<StatementDto>>(
      API_ENDPOINTS.STATEMENTS_BY_ENTITY(entityId),
      undefined,
      'statement-by-entity',
      true,
      false,
      this.resolveUseDev(useDev)
    );
  }

  /**
   * Helper method to strip undefined/null/empty strings from request params
   */
  private cleanParams(raw?: Record<string, any>): Record<string, any> {
    if (!raw) return {};
    return Object.fromEntries(
      Object.entries(raw).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      )
    );
  }
}
