// components/vehicle-analysis/vehicle-transaction-table/vehicle-transaction-table.component.ts
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';

// SheetJS (xlsx) — install with: npm install xlsx
// Then import like this in Angular:
import * as XLSX from 'xlsx';
import { PaymentRecord } from '../../../@core/models/transactions/transactions.models';

type SortField = keyof PaymentRecord;
type SortDir = 'asc' | 'desc';

@Component({
  standalone: true,
  selector: 'app-vehicle-transaction-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    SelectModule,
  ],
  templateUrl: './transactions-table.html',
  styleUrl: './transactions-table.css',
})
export class VehicleTransactionTableComponent implements OnChanges {
  @Input() transactions: PaymentRecord[] = [];
  @Input() period = '';
  @Input() loading = false;

  // ── Pagination ────────────────────────────────────────────────────────────
  pageSize = 10;
  currentPage = 0;

  readonly pageSizeOptions = [
    { label: '5 rows', value: 5 },
    { label: '10 rows', value: 10 },
    { label: '20 rows', value: 20 },
    { label: '50 rows', value: 50 },
  ];

  // ── Filters ───────────────────────────────────────────────────────────────
  searchTerm = '';
  activeStatusFilter: PaymentRecord['paymentStatus'] | '' = '';
  activeTypeFilter: PaymentRecord['transactionType'] | '' = '';

  // ── Sort ──────────────────────────────────────────────────────────────────
  sortField: SortField = 'createdAt';
  sortDir: SortDir = 'desc';

  // ── Derived ───────────────────────────────────────────────────────────────
  filtered: PaymentRecord[] = [];
  paged: PaymentRecord[] = [];

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnChanges(c: SimpleChanges): void {
    if (c['transactions']) {
      this.currentPage = 0;
      this.searchTerm = '';
      this.activeStatusFilter = '';
      this.activeTypeFilter = '';
      this._apply();
    }
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    const delta = 2;
    const pages: number[] = [];
    for (
      let i = Math.max(0, this.currentPage - delta);
      i <= Math.min(this.totalPages - 1, this.currentPage + delta);
      i++
    ) { pages.push(i); }
    return pages;
  }

  get firstRow(): number { return this.filtered.length ? this.currentPage * this.pageSize + 1 : 0; }
  get lastRow(): number { return Math.min((this.currentPage + 1) * this.pageSize, this.filtered.length); }

  // ── Footer totals (ALL filtered rows, not just current page) ─────────────
  get totalCredit(): number {
    return this.filtered
      .filter(t => t.transactionType === 'CREDIT')
      .reduce((s, t) => s + (t.assignedAmount ?? 0), 0);
  }

  get totalDebit(): number {
    return this.filtered
      .filter(t => t.transactionType === 'DEBIT')
      .reduce((s, t) => s + (t.assignedAmount ?? 0), 0);
  }

  get totalAssigned(): number {
    return this.filtered.reduce((s, t) => s + (t.assignedAmount ?? 0), 0);
  }

  get paidCount(): number { return this.filtered.filter(t => t.paymentStatus === 'PAID').length; }
  get pendingCount(): number { return this.filtered.filter(t => t.paymentStatus === 'PENDING').length; }
  get failedCount(): number { return this.filtered.filter(t => t.paymentStatus === 'FAILED').length; }
  get creditCount(): number { return this.filtered.filter(t => t.transactionType === 'CREDIT').length; }
  get debitCount(): number { return this.filtered.filter(t => t.transactionType === 'DEBIT').length; }

  // ── Actions ───────────────────────────────────────────────────────────────
  onSearch(): void { this.currentPage = 0; this._apply(); }

  clearSearch(): void { this.searchTerm = ''; this.onSearch(); }

  toggleStatusFilter(s: PaymentRecord['paymentStatus']): void {
    this.activeStatusFilter = this.activeStatusFilter === s ? '' : s;
    this.currentPage = 0;
    this._apply();
  }

  toggleTypeFilter(t: PaymentRecord['transactionType']): void {
    this.activeTypeFilter = this.activeTypeFilter === t ? '' : t;
    this.currentPage = 0;
    this._apply();
  }

  onSort(field: SortField): void {
    this.sortDir = this.sortField === field && this.sortDir === 'asc' ? 'desc' : 'asc';
    this.sortField = field;
    this.currentPage = 0;
    this._apply();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this._page();
    this.cdr.markForCheck();
  }

  onPageSizeChange(): void { this.currentPage = 0; this._apply(); }

  // ── Export ────────────────────────────────────────────────────────────────

  /** Builds the rows array shared by both CSV and Excel exports */
  private _exportRows(): { headers: string[]; rows: (string | number)[][] } {
    const headers = [
      'M-Pesa Receipt', 'Date', 'Updated At', 'Fleet', 'Driver',
      'Customer', 'Pickup', 'Drop-off', 'Trip ID',
      'Type', 'Amount (KES)', 'Status',
    ];
    const rows = this.filtered.map(t => [
      t.mpesaReceiptNumber,
      this.fmtDate(t.createdAt),
      this.fmtDate(t.updatedAt),
      t.fleetNumber,
      t.activeDriverUsername ?? '',
      t.customerName ?? '',
      t.pickup ?? '',
      t.dropOff ?? '',
      t.tripId ?? '',
      t.transactionType,
      t.assignedAmount,        // raw number for Excel (formatted string for CSV)
      t.paymentStatus,
    ]);
    return { headers, rows };
  }

  exportCsv(): void {
    const { headers, rows } = this._exportRows();
    // Format the amount as a string for CSV
    const csvRows = rows.map(r => r.map((v, i) =>
      i === 10 ? (v as number).toFixed(2) : String(v)
    ));
    const csv = [headers, ...csvRows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    this._download(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      `payments_${this.period || 'export'}.csv`,
    );
  }

  exportExcel(): void {
    const { headers, rows } = this._exportRows();

    // Build worksheet data: header row + data rows
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // ── Column widths ──────────────────────────────────────────────────────
    ws['!cols'] = [
      { wch: 20 }, // Receipt
      { wch: 20 }, // Date
      { wch: 20 }, // Updated At
      { wch: 12 }, // Fleet
      { wch: 22 }, // Driver
      { wch: 22 }, // Customer
      { wch: 22 }, // Pickup
      { wch: 22 }, // Drop-off
      { wch: 18 }, // Trip ID
      { wch: 10 }, // Type
      { wch: 14 }, // Amount
      { wch: 10 }, // Status
    ];

    // ── Number format for Amount column (column index 10, letter K) ────────
    const amountColLetter = XLSX.utils.encode_col(10); // 'K'
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const cellRef = `${amountColLetter}${row + 1}`;
      if (ws[cellRef]) {
        ws[cellRef].z = '#,##0.00';  // Excel number format
      }
    }

    // ── Workbook ───────────────────────────────────────────────────────────
    const wb = XLSX.utils.book_new();
    const sheetName = `Payments ${this.period || 'Export'}`.slice(0, 31); // Excel sheet name limit
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    XLSX.writeFile(wb, `payments_${this.period || 'export'}.xlsx`);
  }

  // ── Display helpers ───────────────────────────────────────────────────────
  statusSeverity(s: string): 'success' | 'warn' | 'danger' {
    return ({ PAID: 'success', PENDING: 'warn', FAILED: 'danger' } as any)[s] ?? 'warn';
  }

  sortIcon(field: string): string {
    if (this.sortField !== field) return 'pi pi-sort sort-dim';
    return this.sortDir === 'asc' ? 'pi pi-sort-up-fill sort-active' : 'pi pi-sort-down-fill sort-active';
  }

  fmtAmount(n: number | undefined): string {
    if (n == null) return '—';
    return n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtDate(iso: string): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('en-KE', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
      });
    } catch { return iso; }
  }

  rowIdx(i: number): number {
    return this.currentPage * this.pageSize + i + 1;
  }

  truncate(s: string | null | undefined, len = 14): string {
    if (!s) return '—';
    return s.length > len ? s.slice(0, len) + '…' : s;
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private _download(blob: Blob, filename: string): void {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private _apply(): void {
    let data = [...this.transactions];

    const q = this.searchTerm.toLowerCase().trim();
    if (q) {
      data = data.filter(t =>
        t.mpesaReceiptNumber?.toLowerCase().includes(q) ||
        t.fleetNumber?.toLowerCase().includes(q) ||
        t.customerName?.toLowerCase().includes(q) ||
        t.activeDriverUsername?.toLowerCase().includes(q) ||
        t.tripId?.toLowerCase().includes(q) ||
        t.pickup?.toLowerCase().includes(q) ||
        t.dropOff?.toLowerCase().includes(q)
      );
    }

    if (this.activeStatusFilter) {
      data = data.filter(t => t.paymentStatus === this.activeStatusFilter);
    }

    if (this.activeTypeFilter) {
      data = data.filter(t => t.transactionType === this.activeTypeFilter);
    }

    data.sort((a, b) => {
      const av = a[this.sortField] ?? '';
      const bv = b[this.sortField] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return this.sortDir === 'asc' ? cmp : -cmp;
    });

    this.filtered = data;
    this._page();
    this.cdr.markForCheck();
  }

  private _page(): void {
    const s = this.currentPage * this.pageSize;
    this.paged = this.filtered.slice(s, s + this.pageSize);
  }
}
