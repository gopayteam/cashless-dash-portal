// pages/wallets/organization-balance/organization-balance.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import {
  BalanceCheckResponse,
  BalanceHistoryResponse,
  BalanceLatestResponse,
  BalanceQueryResponse,
  BalanceRecord,
  BalanceSufficiency,
  SubAccount,
} from '../../../../@core/models/organization/organization-balance.model';
import { AuthService } from '../../../../@core/services/auth.service';
import { formatRelativeTime } from '../../../../@core/utils/date-time.util';

/**
 * NOTE ON WIRING — adjust to match your actual DataService / endpoints file.
 * ---------------------------------------------------------------------------
 * This component assumes API_ENDPOINTS exposes:
 *
 *   ORG_BALANCE_QUERY                       -> '/payment/balance/query'                      (POST, body: {partyA, remarks})
 *   ORG_BALANCE_LATEST:  (partyA: string) => `/payment/balance/${partyA}/latest`              (GET)
 *   ORG_BALANCE_HISTORY: (partyA: string) => `/payment/balance/${partyA}/history`             (GET)
 *   ORG_BALANCE_CHECK:   (partyA: string) => `/payment/balance/${partyA}/check`               (GET, ?amount=)
 *
 * It also assumes DataService has a `.get<T>(url, key, silent?)` method that mirrors
 * the `.post<T>(url, body, key, silent?)` already used in wallet-analytics.component.ts.
 * If your DataService's get() signature differs, adjust the calls below only —
 * nothing else in this component needs to change.
 */

interface SubAccountRow extends SubAccount {
  key: string;
  icon: string;
}

type QueryState = 'idle' | 'processing' | 'resolved' | 'timeout' | 'error';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20; // ~60s of polling before giving up

@Component({
  selector: 'app-organization-balance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputNumberModule,
    TooltipModule,
    SkeletonModule,
  ],
  templateUrl: './organization-balance.html',
  styleUrls: ['./organization-balance.css'],
})
export class OrganizationBalanceComponent implements OnInit, OnChanges, OnDestroy {
  /** The M-Pesa/paybill party number this panel represents. Can arrive from a
   *  parent component, or be left empty and typed in by the user via the lookup bar. */
  @Input() partyA = '';

  entityId: string | null = null;

  /** Bound to the lookup input field — the party number the user is currently typing. */
  partyAInput = '';

  /** Inline validation message shown under the lookup input before we even hit the API. */
  partyAValidationError: string | null = null;

  // ---- latest snapshot ----
  latest: BalanceRecord | null = null;
  latestLoaded = false;
  latestNotFound = false;
  latestErrorMessage: string | null = null;
  subAccountRows: SubAccountRow[] = [];

  // ---- live query state ----
  queryState: QueryState = 'idle';
  queryStatusLabel = '';
  private pendingConversationId: string | null = null;
  private pollAttempts = 0;
  private pollHandle: ReturnType<typeof setTimeout> | null = null;

  // ---- history ----
  history: BalanceRecord[] = [];
  historyLoaded = false;
  private expandedIds = new Set<string>();

  // ---- sufficiency checker ----
  checkAmount: number | null = null;
  checking = false;
  checkResult: BalanceSufficiency | null = null;
  checkError: string | null = null;
  checkNotFound = false;

  bypassCache: boolean = true;
  useDevApi: boolean = false;

  get isLegacyBrand(): boolean {
    return this.entityId === 'GS000002';
  }

  constructor(private dataService: DataService, private cdr: ChangeDetectorRef, private authService: AuthService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.entityId = user.entityId;
    } else {
      this.router.navigate(['/login']);
      return;
    }


    this.partyAInput = this.partyA;
    if (this.partyA) {
      this.loadLatest();
      this.loadHistory();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['partyA'] && !changes['partyA'].firstChange && this.partyA) {
      this.partyAInput = this.partyA;
      this.resetState();
      this.loadLatest();
      this.loadHistory();
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  // =============== Party lookup ===============

  /** Whether a party number has been loaded — gates the balance/history UI vs. the lookup bar. */
  get hasParty(): boolean {
    return !!this.partyA;
  }

  /** Called when the user submits the lookup bar (button click or Enter key). */
  submitPartyA(): void {
    const trimmed = (this.partyAInput || '').trim();
    this.partyAValidationError = null;

    if (!trimmed) return;

    // Till/paybill numbers are numeric — catch obvious typos before spending a request.
    if (!/^\d{5,12}$/.test(trimmed)) {
      this.partyAValidationError = 'Enter a valid till/paybill number (digits only).';
      return;
    }

    this.resetState();
    this.partyA = trimmed;
    this.loadLatest();
    this.loadHistory();
  }

  /** Lets the user swap to a different party number without reloading the page. */
  changeParty(): void {
    this.stopPolling();
    this.partyAInput = this.partyA;
    this.partyA = '';
  }

  // =============== User actions ===============

  refreshBalance(): void {
    if (this.queryState === 'processing' || !this.partyA) return;

    this.queryState = 'processing';
    this.queryStatusLabel = 'Sending request…';
    this.cdr.detectChanges();

    this.dataService
      .post<BalanceQueryResponse>(
        API_ENDPOINTS.ORG_BALANCE_QUERY,
        { partyA: this.partyA, remarks: 'Organization Balance inquiry' },
        'org-balance-query',
        this.bypassCache,
        this.useDevApi,
      )
      .subscribe({
        next: (response) => {
          this.pendingConversationId = response.data.conversationId;
          this.pollAttempts = 0;
          this.queryStatusLabel = 'Request queued — awaiting confirmation…';
          this.cdr.detectChanges();
          this.schedulePoll();
        },
        error: (err) => {
          console.error('Failed to initiate balance query', err);
          this.queryState = 'error';
          this.queryStatusLabel = "Couldn't start the balance query. Try again.";
          this.cdr.detectChanges();
        },
      });
  }

  checkSufficiency(): void {
    if (!this.checkAmount || this.checkAmount <= 0 || !this.partyA) return;

    this.checking = true;
    this.checkResult = null;
    this.checkError = null;
    this.checkNotFound = false;

    this.dataService
      .getWithoutParams<BalanceCheckResponse>(
        `${API_ENDPOINTS.ORG_BALANCE_CHECK(this.partyA)}?amount=${this.checkAmount}`,
        'org-balance-check',
        this.bypassCache,
        this.useDevApi,
      )
      .subscribe({
        next: (response) => {
          this.checkResult = response.data;
          this.checking = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          // The API still returns a full sufficiency payload alongside a 404 when
          // no record exists yet — show it like a normal result instead of a dead end.
          const payload: BalanceSufficiency | undefined = err?.error?.data;
          if (this.isNotFound(err) && payload) {
            this.checkResult = payload;
            this.checkNotFound = true;
          } else {
            console.error('Failed to check balance sufficiency', err);
            this.checkError = "Couldn't check sufficiency right now. Try again.";
          }
          this.checking = false;
          this.cdr.detectChanges();
        },
      });
  }

  toggleExpanded(record: BalanceRecord): void {
    const id = record.conversationId;
    this.expandedIds.has(id) ? this.expandedIds.delete(id) : this.expandedIds.add(id);
  }

  isExpanded(record: BalanceRecord): boolean {
    return this.expandedIds.has(record.conversationId);
  }

  // =============== Data loading ===============

  private loadLatest(silent = true): void {
    this.dataService
      .getWithoutParams<BalanceLatestResponse>(API_ENDPOINTS.ORG_BALANCE_LATEST(this.partyA), 'org-balance-latest', this.bypassCache,
        this.useDevApi,)
      .subscribe({
        next: (response) => {
          this.applyLatest(response.data);
          this.latestNotFound = false;
          this.latestErrorMessage = null;
          this.latestLoaded = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (this.isNotFound(err)) {
            // Expected for a till that's never been queried, or a mistyped number —
            // not a console-worthy failure.
            this.latest = null;
            this.subAccountRows = [];
            this.latestNotFound = true;
            this.latestErrorMessage = this.apiMessage(err, `No balance record found for ${this.partyA}.`);
          } else {
            console.error('Failed to load latest balance', err);
            this.latestNotFound = false;
            this.latestErrorMessage = "Couldn't load the balance right now. Try again shortly.";
          }
          this.latestLoaded = true;
          this.cdr.detectChanges();
        },
      });
  }

  private loadHistory(): void {
    this.dataService
      .getWithoutParams<BalanceHistoryResponse>(API_ENDPOINTS.ORG_BALANCE_HISTORY(this.partyA), 'org-balance-history', this.bypassCache,
        this.useDevApi,)
      .subscribe({
        next: (response) => {
          this.history = (response.data ?? [])
            .slice()
            .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
          this.historyLoaded = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load balance history', err);
          this.historyLoaded = true;
          this.cdr.detectChanges();
        },
      });
  }

  private applyLatest(record: BalanceRecord): void {
    this.latest = record;
    this.subAccountRows = [
      { key: 'workingAccount', icon: 'pi-briefcase', ...(record.workingAccount ?? this.emptySubAccount('Working Account')) },
      { key: 'utilityAccount', icon: 'pi-bolt', ...(record.utilityAccount ?? this.emptySubAccount('Utility Account')) },
      { key: 'chargesPaidAccount', icon: 'pi-percentage', ...(record.chargesPaidAccount ?? this.emptySubAccount('Charges Paid Account')) },
      { key: 'merchantAccount', icon: 'pi-shop', ...(record.merchantAccount ?? this.emptySubAccount('Merchant Account')) },
      { key: 'settlementAccount', icon: 'pi-verified', ...(record.settlementAccount ?? this.emptySubAccount('Settlement Account')) },
    ];
  }

  private emptySubAccount(name: string): SubAccount {
    return { name, balance: 0, available: null, reserved: null, uncleared: null };
  }

  // =============== Polling for query resolution ===============
  // There's no "get by conversationId" endpoint, so we poll /latest and watch
  // for it to (a) match the conversationId our query returned and (b) move
  // past QUEUED/PENDING into a terminal status.

  private schedulePoll(): void {
    this.stopPolling();
    this.pollHandle = setTimeout(() => this.poll(), POLL_INTERVAL_MS);
  }

  private poll(): void {
    this.pollAttempts++;

    this.dataService
      .getWithoutParams<BalanceLatestResponse>(API_ENDPOINTS.ORG_BALANCE_LATEST(this.partyA), 'org-balance-poll', this.bypassCache,
        this.useDevApi,)
      .subscribe({
        next: (response) => {
          const record = response.data;
          const matches = record.conversationId === this.pendingConversationId;
          const resolved = matches && record.status !== 'QUEUED' && record.status !== 'PENDING';

          if (resolved) {
            this.applyLatest(record);
            this.queryState = 'resolved';
            this.queryStatusLabel = record.status === 'SUCCESS' ? 'Balance updated' : `Query ${record.status.toLowerCase()}`;
            this.pendingConversationId = null;
            this.loadHistory();
            this.cdr.detectChanges();
            setTimeout(() => {
              if (this.queryState === 'resolved') {
                this.queryState = 'idle';
                this.cdr.detectChanges();
              }
            }, 3000);
            return;
          }

          if (this.pollAttempts >= MAX_POLL_ATTEMPTS) {
            this.queryState = 'timeout';
            this.queryStatusLabel = 'Still processing — check back shortly, or view history below.';
            this.cdr.detectChanges();
            return;
          }

          this.schedulePoll();
        },
        error: (err) => {
          if (this.isNotFound(err)) {
            // Record hasn't materialized yet (or the till number doesn't exist) —
            // keep polling quietly rather than treating this as a connectivity error.
            if (this.pollAttempts >= MAX_POLL_ATTEMPTS) {
              this.queryState = 'timeout';
              this.queryStatusLabel = `No balance record was created for ${this.partyA}. Double-check the till number.`;
              this.cdr.detectChanges();
              return;
            }
            this.schedulePoll();
            return;
          }

          console.error('Balance poll failed', err);
          if (this.pollAttempts >= MAX_POLL_ATTEMPTS) {
            this.queryState = 'error';
            this.queryStatusLabel = 'Lost connection while waiting for confirmation.';
            this.cdr.detectChanges();
            return;
          }
          this.schedulePoll();
        },
      });
  }

  private stopPolling(): void {
    if (this.pollHandle) {
      clearTimeout(this.pollHandle);
      this.pollHandle = null;
    }
  }

  private resetState(): void {
    this.stopPolling();
    this.latest = null;
    this.latestLoaded = false;
    this.latestNotFound = false;
    this.latestErrorMessage = null;
    this.subAccountRows = [];
    this.queryState = 'idle';
    this.queryStatusLabel = '';
    this.pendingConversationId = null;
    this.pollAttempts = 0;
    this.history = [];
    this.historyLoaded = false;
    this.expandedIds.clear();
    this.checkResult = null;
    this.checkError = null;
    this.checkNotFound = false;
    this.checkAmount = null;
  }

  // =============== Template helpers ===============

  formatRelative(iso: string | null): string {
    return iso ? formatRelativeTime(iso) : '—';
  }

  statusVariant(status: string): 'success' | 'pending' | 'failed' {
    if (status === 'SUCCESS') return 'success';
    if (status === 'QUEUED' || status === 'PENDING') return 'pending';
    return 'failed';
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'Success';
      case 'QUEUED':
        return 'Queued';
      case 'PENDING':
        return 'Pending';
      default:
        return status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Unknown';
    }
  }

  // =============== Error helpers ===============
  // Angular's HttpClient surfaces a non-2xx JSON body as `err.error` on the
  // HttpErrorResponse, and the status code as both `err.status` and (per this
  // API's convention) `err.error.code`. We check both so this keeps working
  // even if DataService normalizes errors slightly differently.

  private isNotFound(err: any): boolean {
    return err?.status === 404 || err?.error?.code === 404;
  }

  private apiMessage(err: any, fallback: string): string {
    return err?.error?.message || fallback;
  }
}
