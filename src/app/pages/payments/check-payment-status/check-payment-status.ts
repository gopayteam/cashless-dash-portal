// pages/payments/payment-status-check/payment-status-check.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';

// ── Payment state values — only present on code === 0 responses ──
export type PaymentStatusValue = 'PAID' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'UNKNOWN';

// ── Raw API response shape ───────────────────────────────────────
// Error shape:   { code: 400, message: "...", status: "BAD_REQUEST" }
// Success shape: { code: 0,   message: "...", status: "PAID", ...txn fields }
export interface PaymentStatusResponse {
  code: number;                  // 0 = success, non-zero = error
  message: string;               // human-readable message from API
  status: string;                // "PAID"|"PENDING"... on success; "BAD_REQUEST" etc. on error

  // Transaction detail fields — only populated when code === 0
  merchantId?: string;
  checkoutId?: string;
  amount?: number;
  customerName?: string;
  mpesaReceiptNumber?: string;
  timestamp?: string;
}

// ── Component UI states ──────────────────────────────────────────
// 'idle'    → form shown, no action taken yet
// 'loading' → request in flight
// 'success' → code === 0, show payment status result
// 'api-error' → code !== 0 (e.g. 400 "No transaction found") — form + API message shown
// 'http-error' → network/HTTP failure — form + fallback message shown
export type CheckState = 'idle' | 'loading' | 'success' | 'api-error' | 'http-error';

@Component({
  selector: 'app-payment-status-check',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
  ],
  templateUrl: './check-payment-status.html',
  styleUrls: ['./check-payment-status.css'],
})
export class PaymentStatusCheckComponent implements OnInit, OnDestroy {
  entityId: string | null = null;

  merchantId: string = '';
  checkoutId: string = '';

  checkState: CheckState = 'idle';

  // Populated on code === 0 only
  statusResult: PaymentStatusResponse | null = null;

  // Populated on any error state
  errorMessage: string = '';
  errorCode: number | null = null;

  // Pulse animation ticker for PENDING status
  private pendingInterval: any;
  pendingDots: string = '';
  private dotCount: number = 0;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public loadingStore: LoadingStore,
  ) { }

  get loading() {
    return this.loadingStore.loading;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.entityId = user.entityId;

    this.route.queryParams.subscribe((params) => {
      if (params['merchantId']) this.merchantId = params['merchantId'];
      if (params['checkoutId']) this.checkoutId = params['checkoutId'];

      // Auto-trigger if navigated here with both params pre-filled
      if (this.merchantId && this.checkoutId) {
        this.checkStatus();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearPendingInterval();
  }

  // ── Guards ───────────────────────────────────────────────────────
  get isFormValid(): boolean {
    return this.merchantId.trim().length > 0 && this.checkoutId.trim().length > 0;
  }

  get isLoading(): boolean {
    return this.checkState === 'loading';
  }

  /** True when the form should be visible (all non-loading, non-success states) */
  get showForm(): boolean {
    return (
      this.checkState === 'idle' ||
      this.checkState === 'api-error' ||
      this.checkState === 'http-error'
    );
  }

  /** True when an error banner should appear below the form */
  get showErrorBanner(): boolean {
    return this.checkState === 'api-error' || this.checkState === 'http-error';
  }

  // ── Main action ──────────────────────────────────────────────────
  checkStatus(): void {
    if (!this.isFormValid) return;

    this.checkState = 'loading';
    this.statusResult = null;
    this.errorMessage = '';
    this.errorCode = null;
    this.clearPendingInterval();
    this.loadingStore.start();

    const url = `${API_ENDPOINTS.CHECK_PAYMENT_STATUS}?merchantId=${encodeURIComponent(
      this.merchantId.trim()
    )}&checkoutId=${encodeURIComponent(this.checkoutId.trim())}`;

    this.dataService
      .post<PaymentStatusResponse>(url, {}, 'payments-status-check', true)
      .subscribe({
        next: (response) => {
          this.loadingStore.stop();

          if (response.code === 0) {
            // ── Happy path: code 0 means the API found the transaction ──
            this.statusResult = response;
            this.checkState = 'success';

            if (this.isPending) {
              this.startPendingAnimation();
            }
          } else {
            // ── API-level error: request succeeded but business logic failed ──
            // e.g. { code: 400, message: "No transaction found...", status: "BAD_REQUEST" }
            this.errorCode = response.code;
            this.errorMessage = response.message || 'The payment could not be found. Please check your IDs and try again.';
            this.checkState = 'api-error';
          }

          this.cdr.detectChanges();
        },
        error: (err) => {
          // ── HTTP-level error: network failure, 5xx, auth error etc. ──
          console.error('Payment status check failed', err);
          this.errorCode = err?.status ?? null;
          this.errorMessage =
            err?.error?.message ||
            'Unable to reach the payment service. Please try again.';
          this.checkState = 'http-error';
          this.loadingStore.stop();
          this.cdr.detectChanges();
        },
      });
  }

  // ── Resets ───────────────────────────────────────────────────────
  /** Clear everything and return to blank form */
  reset(): void {
    this.checkState = 'idle';
    this.statusResult = null;
    this.errorMessage = '';
    this.errorCode = null;
    this.merchantId = '';
    this.checkoutId = '';
    this.clearPendingInterval();
  }

  /** Keep the IDs but allow the user to re-submit */
  retry(): void {
    this.checkState = 'idle';
    this.statusResult = null;
    this.errorMessage = '';
    this.errorCode = null;
    this.clearPendingInterval();
  }

  goBack(): void {
    this.router.navigate(['/transactions/all']);
  }

  // ── Payment status helpers (only valid when checkState === 'success') ──
  get isPaid(): boolean {
    return this.statusResult?.status === 'PAID' || this.statusResult?.status === 'SUCCESS';
  }

  get isPending(): boolean {
    return this.statusResult?.status === 'PENDING';
  }

  get isFailed(): boolean {
    return this.statusResult?.status === 'FAILED';
  }

  get isCancelled(): boolean {
    return this.statusResult?.status === 'CANCELLED';
  }

  get isUnknown(): boolean {
    return !['PAID', 'SUCCESS', 'PENDING', 'FAILED', 'CANCELLED'].includes(
      this.statusResult?.status ?? ''
    );
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      PAID: 'Payment Confirmed',
      SUCCESS: 'Payment Confirmed',
      PENDING: 'Payment Pending',
      FAILED: 'Payment Failed',
      CANCELLED: 'Payment Cancelled',
    };
    return map[this.statusResult?.status ?? ''] ?? 'Status Unknown';
  }

  get statusSubtitle(): string {
    const map: Record<string, string> = {
      PAID: 'This transaction has been successfully processed.',
      SUCCESS: 'This transaction has been successfully processed.',
      PENDING: 'The payment is still being processed. Please check again shortly.',
      FAILED: 'The transaction could not be completed.',
      CANCELLED: 'This payment was cancelled before completion.',
    };
    return map[this.statusResult?.status ?? ''] ?? 'We could not determine the status of this payment.';
  }

  // ── Pending dot animation ────────────────────────────────────────
  private startPendingAnimation(): void {
    this.pendingInterval = setInterval(() => {
      this.dotCount = (this.dotCount + 1) % 4;
      this.pendingDots = '.'.repeat(this.dotCount);
      this.cdr.detectChanges();
    }, 500);
  }

  private clearPendingInterval(): void {
    if (this.pendingInterval) {
      clearInterval(this.pendingInterval);
      this.pendingInterval = null;
    }
    this.pendingDots = '';
    this.dotCount = 0;
  }
}