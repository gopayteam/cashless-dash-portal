// pages/vehicle-forecast/vehicle-forecast.component.ts
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, interval, of } from 'rxjs';
import { switchMap, takeUntil, takeWhile, catchError } from 'rxjs/operators';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';

import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

import { Router } from '@angular/router';
import { AuthService } from '../../../@core/services/auth.service';
import { DataService } from '../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../@core/api/endpoints';
import { VehicleAnalysisService } from '../../../@core/services/vehicle-analysis.service';
import { ForecastService } from '../../../@core/services/forecast.service';
import {
  TransactionRecord,
  FREQ_OPTIONS,
  ModelOption,
  FORECAST_MODELS,
  ForecastResponse,
  ForecastRequest,
} from '../../../@core/models/forecast/forecast.models';
import { Vehicle } from '../../../@core/models/vehicle/vehicle.model';
import { VehicleApiResponse } from '../../../@core/models/vehicle/vehicle_reponse.model';
import Papa from 'papaparse';

declare var Plotly: any;

// ── Types ────────────────────────────────────────────────────────────────────

type PeriodTab = 'day' | 'week' | 'month' | 'year';
type DataSourceMode = 'live' | 'file';

export interface VehicleReportRow {
  fleetNumber: string;
  count: number;
  total: number;
  percentage: number;   // % of records from this vehicle vs all loaded records
  creditCount: number;
  creditTotal: number;
}

export interface TransactionReport {
  totalRecords: number;
  creditRecords: number;
  debitRecords: number;
  uniqueVehicles: number;
  dateRange: { start: string; end: string } | null;
  selectedVehicles: VehicleReportRow[];
  selectedTotal: number;
  selectedPercentage: number;   // % of selected-vehicle records vs all records
}

interface YearOption { label: string; value: number; }
interface MonthOption { label: string; value: number; }

const MONTHS: MonthOption[] = [
  { label: 'January', value: 1 }, { label: 'February', value: 2 },
  { label: 'March', value: 3 }, { label: 'April', value: 4 },
  { label: 'May', value: 5 }, { label: 'June', value: 6 },
  { label: 'July', value: 7 }, { label: 'August', value: 8 },
  { label: 'September', value: 9 }, { label: 'October', value: 10 },
  { label: 'November', value: 11 }, { label: 'December', value: 12 },
];

@Component({
  standalone: true,
  selector: 'app-vehicle-forecast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SliderModule,
    SelectButtonModule,
    ProgressSpinnerModule,
    ToastModule,
    SkeletonModule,
    TooltipModule,
    MultiSelectModule,
    TabsModule,
    TableModule,
    TagModule,
    ChipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSliderModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  templateUrl: './vehicle-forecasting.html',
  styleUrls: ['./vehicle-forecasting.css', '../../../styles/global/_toast.css'],
})
export class VehicleForecastComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {

  @Input() transactions: TransactionRecord[] = [];
  @Input() vehicleId?: string;

  @ViewChild('plotlyChart') plotlyChartRef!: ElementRef;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // ── Auth & Selection State ───────────────────────────────────────────
  entityId: string | null = null;
  allVehicles: Vehicle[] = [];
  selectedFleets: string[] = [];
  fleetOptions: { label: string; value: string }[] = [];
  readonly MAX_FLEETS = 5;

  // ── Data Source Mode ─────────────────────────────────────────────────
  dataSourceMode: DataSourceMode = 'live';

  // File upload state
  uploadedFile: File | null = null;
  uploadedFileId: string | null = null;        // backend file_id after /upload
  fileUploadMode: 'backend' | 'browser' = 'browser'; // which parsing strategy
  fileParseLoading = false;
  fileUploadLoading = false;
  fileTransactions: TransactionRecord[] = [];  // browser-parsed transactions
  fileSummary: { name: string; rows: number; columns: string[] } | null = null;

  // ── Period Tabs ──────────────────────────────────────────────────────
  activeTabValue: PeriodTab = 'week';
  dayDate: Date = new Date();
  weekStartDate: Date = this._addDays(new Date(), -6);
  weekEndDate: Date = new Date();
  monthYear: number = new Date().getFullYear();
  monthMonth: number = new Date().getMonth() + 1;
  yearYear: number = new Date().getFullYear();
  months = MONTHS;
  years: YearOption[] = this._buildYearOptions();

  // ── Config ───────────────────────────────────────────────────────────
  periods = 30;
  freq: 'D' | 'W' | 'MS' = 'D';
  selectedModels: string[] = ['arima', 'prophet', 'random_forest'];
  freqOptions = FREQ_OPTIONS;
  availableModels: ModelOption[] = FORECAST_MODELS;

  // ── Transaction Report ───────────────────────────────────────────────
  transactionReport: TransactionReport | null = null;

  // ── State ────────────────────────────────────────────────────────────
  loading = false;
  analysisLoading = false;
  forecastResult: ForecastResponse | null = null;
  chartRendered = false;

  private _destroy$ = new Subject<void>();
  private _pollSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dataService: DataService,
    private analysisService: VehicleAnalysisService,
    private forecastService: ForecastService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) { this.router.navigate(['/login']); return; }
    this.entityId = user.entityId;
    this._loadVehicles();
  }

  ngAfterViewInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions'] && this.transactions.length > 0) {
      this.forecastResult = null;
      this.chartRendered = false;
      this._buildReport();
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this._pollSub?.unsubscribe();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Data Source Mode
  // ─────────────────────────────────────────────────────────────────────

  switchDataSource(mode: DataSourceMode): void {
    this.dataSourceMode = mode;
    this.transactions = [];
    this.fileTransactions = [];
    this.uploadedFile = null;
    this.uploadedFileId = null;
    this.fileSummary = null;
    this.forecastResult = null;
    this.transactionReport = null;
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Vehicles
  // ─────────────────────────────────────────────────────────────────────

  private _loadVehicles(): void {
    const payload = { entityId: this.entityId, page: 0, size: 1000 };
    this.dataService
      .post<VehicleApiResponse>(API_ENDPOINTS.ALL_VEHICLES, payload, 'vehicles', false)
      .subscribe({
        next: (res) => {
          this.allVehicles = res.data;
          this.fleetOptions = res.data.map((v) => ({
            label: `${v.fleetNumber} — ${v.registrationNumber}`,
            value: v.fleetNumber,
          }));
          this.cdr.markForCheck();
        },
        error: () => this.messageService.add({
          severity: 'error', summary: 'Error', detail: 'Failed to load vehicles',
        }),
      });
  }

  get canFetch(): boolean {
    return this.selectedFleets.length > 0 && this.selectedFleets.length <= this.MAX_FLEETS;
  }

  onFleetSelectionChange(): void {
    if (this.selectedFleets.length > this.MAX_FLEETS) {
      this.selectedFleets = this.selectedFleets.slice(0, this.MAX_FLEETS);
      this.messageService.add({
        severity: 'warn',
        summary: 'Limit reached',
        detail: `You can compare up to ${this.MAX_FLEETS} fleets`,
      });
    }
    this.transactions = [];
    this.forecastResult = null;
    this.transactionReport = null;
    this._rebuildReportForFile(); // recalc if file loaded
  }

  onTabChange(value: string | any): void {
    this.activeTabValue = value as PeriodTab;
    this.transactions = [];
    this.forecastResult = null;
    this.transactionReport = null;

    if (this.activeTabValue === 'day') { this.freq = 'D'; this.periods = 7; }
    else if (this.activeTabValue === 'week') { this.freq = 'D'; this.periods = 14; }
    else if (this.activeTabValue === 'month') { this.freq = 'D'; this.periods = 30; }
    else if (this.activeTabValue === 'year') { this.freq = 'W'; this.periods = 12; }
  }

  onWeekStartChange(): void {
    if (this.weekStartDate) {
      this.weekEndDate = this._addDays(new Date(this.weekStartDate), 6);
      this.cdr.markForCheck();
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Live Data Fetch
  // ─────────────────────────────────────────────────────────────────────

  fetchData(): void {
    if (!this.canFetch) {
      this.messageService.add({
        severity: 'warn', summary: 'Select Fleet', detail: 'Please select at least one fleet',
      });
      return;
    }

    this.analysisLoading = true;
    this.transactions = [];
    this.forecastResult = null;
    this.transactionReport = null;
    this.cdr.markForCheck();

    const entityId = this.entityId!;
    const fleets = this.selectedFleets;
    let obs$;

    switch (this.activeTabValue) {
      case 'day':
        obs$ = this.analysisService.fetchTransactions(entityId, fleets, this._fmt(this.dayDate), this._fmt(this.dayDate));
        break;
      case 'week':
        obs$ = this.analysisService.fetchTransactions(entityId, fleets, this._fmt(this.weekStartDate), this._fmt(this.weekEndDate));
        break;
      case 'month': {
        const daysInMonth = new Date(this.monthYear, this.monthMonth, 0).getDate();
        const start = `${this.monthYear}-${String(this.monthMonth).padStart(2, '0')}-01`;
        const end = `${this.monthYear}-${String(this.monthMonth).padStart(2, '0')}-${daysInMonth}`;
        obs$ = this.analysisService.fetchTransactions(entityId, fleets, start, end);
        break;
      }
      case 'year':
        obs$ = this.analysisService.fetchTransactions(entityId, fleets, `${this.yearYear}-01-01`, `${this.yearYear}-12-31`, 10000);
        break;
      default:
        obs$ = of([]);
    }

    obs$.pipe(
      takeUntil(this._destroy$),
      catchError((err) => {
        this.messageService.add({
          severity: 'error', summary: 'Fetch Failed',
          detail: err?.error?.detail ?? 'Could not load transactions',
        });
        return of([]);
      })
    ).subscribe((res) => {
      this.transactions = res as any[];
      this.analysisLoading = false;
      if (this.transactions.length === 0) {
        this.messageService.add({
          severity: 'info', summary: 'No Data',
          detail: 'No transactions found for the selected period.',
        });
      } else {
        this._buildReport();
      }
      this.cdr.markForCheck();
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // File Upload — Browser Parsing (SheetJS / PapaParse)
  // ─────────────────────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext ?? '')) {
      this.messageService.add({
        severity: 'error', summary: 'Invalid File',
        detail: 'Only CSV and Excel (.xlsx / .xls) files are supported.',
      });
      return;
    }

    this.uploadedFile = file;
    this.uploadedFileId = null;
    this.fileTransactions = [];
    this.fileSummary = null;
    this.forecastResult = null;
    this.transactionReport = null;
    this.cdr.markForCheck();

    if (this.fileUploadMode === 'browser') {
      this._parseFileBrowser(file);
    } else {
      this._uploadFileToBackend(file);
    }
  }

  private async _parseFileBrowser(file: File): Promise<void> {
    this.fileParseLoading = true;
    this.cdr.markForCheck();

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let rows: any[] = [];

      if (ext === 'csv') {
        rows = await this._parseCsv(file);
      } else {
        rows = await this._parseExcel(file);
      }

      // Normalise column names: map known variants to camelCase frontend keys
      rows = rows.map((r) => this._normaliseRow(r));

      this.fileTransactions = rows as TransactionRecord[];
      this.fileSummary = {
        name: file.name,
        rows: rows.length,
        columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      };

      this._rebuildReportForFile();

      this.messageService.add({
        severity: 'success', summary: 'File Parsed',
        detail: `${rows.length.toLocaleString()} records loaded from ${file.name}`,
      });
    } catch (err: any) {
      this.messageService.add({
        severity: 'error', summary: 'Parse Error',
        detail: err?.message ?? 'Could not parse the file.',
      });
    } finally {
      this.fileParseLoading = false;
      this.cdr.markForCheck();
    }
  }

  private _parseCsv2(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter((l) => l.trim());
          if (lines.length < 2) { resolve([]); return; }

          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const rows = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const obj: any = {};
            headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
            return obj;
          });
          resolve(rows);
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  }

  private _parseCsv(file: File): Promise<any[]> {

    return new Promise((resolve, reject) => {

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,

        complete: (results: { data: any[]; }) => {
          resolve(results.data as any[]);
        },

        error: (error: any) => {
          reject(error);
        }
      });

    });
  }

  private _parseExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Dynamically import SheetJS if available; guide users otherwise
      if (typeof (window as any).XLSX === 'undefined') {
        reject(new Error(
          'SheetJS (XLSX) is not loaded. Add <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script> to index.html for Excel support, or convert your file to CSV.'
        ));
        return;
      }
      const XLSX = (window as any).XLSX;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          resolve(rows);
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Normalise a raw CSV/Excel row to use camelCase keys matching
   * the TransactionRecord interface.  Handles both camelCase (payload)
   * and snake_case (DB export) column names.
   */
  private _normaliseRow2(row: any): any {
    const aliases: Record<string, string> = {
      // Date column
      created_at: 'createdAt',
      date: 'createdAt',
      datetime: 'createdAt',
      timestamp: 'createdAt',
      ds: 'createdAt',
      // Value column
      assigned_amount: 'assignedAmount',
      amount: 'assignedAmount',
      earnings: 'assignedAmount',
      revenue: 'assignedAmount',
      sales: 'assignedAmount',
      value: 'assignedAmount',
      y: 'assignedAmount',
      // Vehicle ID
      fleet_number: 'fleetNumber',
      vehicle_id: 'fleetNumber',
      car_id: 'fleetNumber',
      // Transaction type
      transaction_type: 'transactionType',
      type: 'transactionType',
      // Receipt
      mpesa_receipt_number: 'mpesaReceiptNumber',
    };

    const out: any = {};
    for (const [key, val] of Object.entries(row)) {
      const normalized = aliases[key.toLowerCase()] ?? key;
      out[normalized] = val;
    }

    // Ensure numeric amount
    if (out['assignedAmount'] !== undefined) {
      out['assignedAmount'] = parseFloat(String(out['assignedAmount'])) || 0;
    }

    return out;
  }

  private _normaliseRow(row: any): any {

    // Central mapping configuration
    const fieldMappings: Record<string, string[]> = {

      createdAt: [
        'createdat',
        'created_at',
        'created at',
        'date',
        'datetime',
        'timestamp',
        'transactiondate',
        'time',
        'ds'
      ],

      updatedAt: [
        'updatedat',
        'updated_at',
        'updated at'
      ],

      assignedAmount: [
        'assignedamount',
        'assigned_amount',
        'amount',
        'amountkes',
        'amount(kes)',
        'amount_kes',
        'earnings',
        'revenue',
        'sales',
        'value',
        'y'
      ],

      fleetNumber: [
        'fleetnumber',
        'fleet_number',
        'fleet no',
        'fleet',
        'vehicle',
        'vehicleid',
        'vehicle_id',
        'vehicle_booked',
        'carid',
        'car_id'
      ],

      transactionType: [
        'transactiontype',
        'transaction_type',
        'type'
      ],

      paymentStatus: [
        'paymentstatus',
        'payment_status',
        'status'
      ],

      mpesaReceiptNumber: [
        'mpesareceipt',
        'mpesareceiptnumber',
        'mpesa_receipt_number',
        'receipt',
        'receiptnumber',
        'receipt_number'
      ],

      customerName: [
        'customername',
        'customer_name',
        'name',
        'customer'
      ],

      tripId: [
        'tripid',
        'trip_id'
      ],

      pickup: [
        'pickup',
        'pickuplocation',
        'pickup_location'
      ],

      dropOff: [
        'dropoff',
        'drop_off',
        'droplocation',
        'drop_location'
      ],

      activeDriverUsername: [
        'driver',
        'driveruser',
        'driverusername',
        'driver_username',
        'driver user'
      ]
    };

    const normalizedMap = new Map<string, string>();

    // Build reverse lookup map
    for (const [targetField, aliases] of Object.entries(fieldMappings)) {
      for (const alias of aliases) {
        normalizedMap.set(this._normalizeColumnName(alias), targetField);
      }
    }

    const out: any = {};

    for (const [rawKey, value] of Object.entries(row)) {

      const normalizedKey = this._normalizeColumnName(rawKey);

      const mappedField =
        normalizedMap.get(normalizedKey) || rawKey;

      out[mappedField] = value;
    }

    // Convert amount safely
    if (out.assignedAmount !== undefined) {

      out.assignedAmount = parseFloat(
        String(out.assignedAmount)
          .replace(/,/g, '')
          .replace(/[^\d.-]/g, '')
      ) || 0;
    }

    // Normalize transaction type
    if (out.transactionType) {
      out.transactionType =
        String(out.transactionType).toUpperCase();
    }

    // Normalize payment status
    if (out.paymentStatus) {
      out.paymentStatus =
        String(out.paymentStatus).toUpperCase();
    }

    return out;
  }

  private _normalizeColumnName(name: string): string {

    return String(name)
      .toLowerCase()
      .trim()
      .replace(/[\s_-]+/g, '')
      .replace(/[()]/g, '');
  }

  // ─────────────────────────────────────────────────────────────────────
  // File Upload — Backend (/upload endpoint)
  // ─────────────────────────────────────────────────────────────────────

  private _uploadFileToBackend(file: File): void {
    this.fileUploadLoading = true;
    this.cdr.markForCheck();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', this.entityId ?? 'anonymous');

    this.forecastService.uploadFile(formData).pipe(
      takeUntil(this._destroy$)
    ).subscribe({
      next: (res: { file_id: string | null; row_count: any; column_names: any; }) => {
        this.uploadedFileId = res.file_id;
        this.fileSummary = {
          name: file.name,
          rows: res.row_count ?? 0,
          columns: res.column_names ?? [],
        };
        this.fileUploadLoading = false;
        this.messageService.add({
          severity: 'success', summary: 'File Uploaded',
          detail: `${(res.row_count ?? 0).toLocaleString()} rows ready — file ID: ${res.file_id?.slice(0, 8)}…`,
        });
        this.cdr.markForCheck();
      },
      error: (err: { error: { detail: any; }; }) => {
        this.fileUploadLoading = false;
        this.messageService.add({
          severity: 'error', summary: 'Upload Failed',
          detail: err?.error?.detail ?? 'Could not upload the file to the server.',
        });
        this.cdr.markForCheck();
      },
    });
  }

  clearFile(): void {
    this.uploadedFile = null;
    this.uploadedFileId = null;
    this.fileTransactions = [];
    this.fileSummary = null;
    this.forecastResult = null;
    this.transactionReport = null;
    if (this.fileInputRef) this.fileInputRef.nativeElement.value = '';
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Transaction Report
  // ─────────────────────────────────────────────────────────────────────

  /** Build the report from live-fetched transactions */
  private _buildReport(): void {
    const all = this.transactions;
    if (!all.length) { this.transactionReport = null; return; }

    // All-record stats
    const creditAll = all.filter((t) => t.transactionType === 'CREDIT');
    const debitAll = all.filter((t) => t.transactionType === 'DEBIT');
    const vehicles = [...new Set(all.map((t) => t.fleetNumber))];

    // Date range
    const dates = all.map((t) => t.createdAt ?? t.currentDay).filter(Boolean).sort();
    const dateRange = dates.length
      ? { start: dates[0].slice(0, 10), end: dates[dates.length - 1].slice(0, 10) }
      : null;

    // Per-selected-vehicle breakdown
    const fleetFilter = this.selectedFleets.length > 0
      ? this.selectedFleets
      : vehicles;

    const vehicleRows: VehicleReportRow[] = fleetFilter.map((fleet) => {
      const rows = all.filter((t) => t.fleetNumber === fleet);
      const credit = rows.filter((t) => t.transactionType === 'CREDIT');
      const total = credit.reduce((s, t) => s + (t.assignedAmount ?? 0), 0);
      return {
        fleetNumber: fleet,
        count: rows.length,
        total: credit.reduce((s, t) => s + (t.assignedAmount ?? 0), 0),
        percentage: all.length ? Math.round((rows.length / all.length) * 10000) / 100 : 0,
        creditCount: credit.length,
        creditTotal: total,
      };
    });

    const selectedTotal = vehicleRows.reduce((s, r) => s + r.count, 0);
    const selectedPercentage = all.length ? Math.round((selectedTotal / all.length) * 10000) / 100 : 0;

    this.transactionReport = {
      totalRecords: all.length,
      creditRecords: creditAll.length,
      debitRecords: debitAll.length,
      uniqueVehicles: vehicles.length,
      dateRange,
      selectedVehicles: vehicleRows,
      selectedTotal,
      selectedPercentage,
    };
    this.cdr.markForCheck();
  }

  /** Rebuild report when file source fleet selection changes */
  private _rebuildReportForFile(): void {
    if (this.dataSourceMode !== 'file' || !this.fileTransactions.length) return;
    const all = this.fileTransactions;

    const creditAll = all.filter((t) => (t as any).transactionType === 'CREDIT');
    const debitAll = all.filter((t) => (t as any).transactionType === 'DEBIT');
    const vehicles = [...new Set(all.map((t) => (t as any).fleetNumber).filter(Boolean))];

    const dates = all.map((t: any) => t.createdAt ?? t.currentDay).filter(Boolean).sort();
    const dateRange = dates.length
      ? { start: dates[0].slice(0, 10), end: dates[dates.length - 1].slice(0, 10) }
      : null;

    const fleetFilter = this.selectedFleets.length > 0 ? this.selectedFleets : vehicles;

    const vehicleRows: VehicleReportRow[] = fleetFilter.map((fleet) => {
      const rows = all.filter((t: any) => t.fleetNumber === fleet);
      const credit = rows.filter((t: any) => t.transactionType === 'CREDIT');
      const total = credit.reduce((s: number, t: any) => s + (parseFloat(t.assignedAmount) || 0), 0);
      return {
        fleetNumber: fleet,
        count: rows.length,
        total,
        percentage: all.length ? Math.round((rows.length / all.length) * 10000) / 100 : 0,
        creditCount: credit.length,
        creditTotal: total,
      };
    });

    const selectedTotal = vehicleRows.reduce((s, r) => s + r.count, 0);
    const selectedPercentage = all.length ? Math.round((selectedTotal / all.length) * 10000) / 100 : 0;

    this.transactionReport = {
      totalRecords: all.length,
      creditRecords: creditAll.length,
      debitRecords: debitAll.length,
      uniqueVehicles: vehicles.length,
      dateRange,
      selectedVehicles: vehicleRows,
      selectedTotal,
      selectedPercentage,
    };
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Active transactions (live or file)
  // ─────────────────────────────────────────────────────────────────────

  get activeTransactions(): TransactionRecord[] {
    if (this.dataSourceMode === 'file') {
      // If fleet filter set, filter file transactions to selected fleets
      const all = this.fileTransactions as any[];
      if (this.selectedFleets.length > 0) {
        return all.filter((t) => this.selectedFleets.includes(t.fleetNumber));
      }
      return all;
    }
    return this.transactions;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Computed getters
  // ─────────────────────────────────────────────────────────────────────

  get canForecast(): boolean {
    return (
      this.activeTransactions.length >= 10 &&
      this.selectedModels.length > 0 &&
      !this.loading
    );
  }

  get insufficientData(): boolean {
    const n = this.activeTransactions.length;
    return n > 0 && n < 10;
  }

  /**
   * The "not enough data" reason — explains the daily-resampling issue.
   * Shown only when we have records but fewer than 10 unique days.
   */
  get insufficientDataReason(): string {
    const txs = this.activeTransactions;
    if (!txs.length) return '';

    const days = new Set(
      txs.map((t: any) => (t.createdAt ?? t.currentDay ?? '').slice(0, 10))
    );
    const uniqueDays = days.size;
    const totalRecords = txs.length;

    if (uniqueDays < 10) {
      return (
        `You have ${totalRecords} transaction record${totalRecords !== 1 ? 's' : ''} ` +
        `but they span only ${uniqueDays} unique day${uniqueDays !== 1 ? 's' : ''}. ` +
        `Forecasting resamples to daily points — you need data spread across at least 10 different dates. ` +
        `Try selecting the Month or Year tab to capture a wider date range, ` +
        `or switch to Weekly aggregation (W) if your data is sparse.`
      );
    }
    return (
      `${totalRecords} records loaded, but fewer than 10 data points remain ` +
      `after resampling and CREDIT-only filtering. ` +
      `Try a longer date range or switch to Weekly aggregation.`
    );
  }

  get metricEntries(): { key: string; value: number }[] {
    if (!this.forecastResult?.metrics) return [];
    return Object.entries(this.forecastResult.metrics).map(([key, value]) => ({
      key,
      value: typeof value === 'number' ? value : 0,
    }));
  }

  get freqLabel(): string {
    return this.freqOptions.find((f) => f.value === this.freq)?.label ?? this.freq;
  }

  get isFileReady(): boolean {
    if (this.fileUploadMode === 'browser') return this.fileTransactions.length > 0;
    return !!this.uploadedFileId;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Model toggle
  // ─────────────────────────────────────────────────────────────────────

  toggleModel(model: string): void {
    const idx = this.selectedModels.indexOf(model);
    if (idx === -1) {
      this.selectedModels = [...this.selectedModels, model];
    } else {
      if (this.selectedModels.length === 1) return;
      this.selectedModels = this.selectedModels.filter((m) => m !== model);
    }
  }

  isModelSelected(model: string): boolean {
    return this.selectedModels.includes(model);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Run Forecast
  // ─────────────────────────────────────────────────────────────────────

  runForecast(): void {
    if (!this.canForecast) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Forecast',
        detail: 'Need at least 10 transaction records and at least one model selected.',
      });
      return;
    }

    this.loading = true;
    this.forecastResult = null;
    this.chartRendered = false;
    this.cdr.markForCheck();

    // ── Sanitize: ensure currentDay is always present ──────────────────
    const sanitizedTransactions = this.activeTransactions.map((t: any) => ({
      ...t,
      currentDay: t.currentDay ?? (t.createdAt ? t.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
    }));

    let request: ForecastRequest;

    if (this.dataSourceMode === 'file' && this.fileUploadMode === 'backend' && this.uploadedFileId) {
      request = {
        source: 'file',
        file_id: this.uploadedFileId,
        vehicle_id: this.selectedFleets[0] ?? undefined,
        periods: this.periods,
        freq: this.freq,
        models: this.selectedModels,
        use_cache: false,
      };
    } else {
      request = {
        source: 'payload',
        transactions: sanitizedTransactions,
        vehicle_id: this.vehicleId ?? (this.selectedFleets.length > 0 ? this.selectedFleets.join(',') : 'unknown'),
        periods: this.periods,
        freq: this.freq,
        models: this.selectedModels,
        use_cache: false,
      };
    }

    this.forecastService
      .postForecast(request)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 'processing' && res.job_id) {
            this._pollJob(res.job_id);
          } else {
            this._handleResult(res);
          }
        },
        error: (err) => {
          this.loading = false;
          const detail = err?.error?.detail ?? 'An unexpected error occurred.';
          this.messageService.add({ severity: 'error', summary: 'Forecast Failed', detail });
          this.cdr.markForCheck();
        },
      });
  }

  private _pollJob(jobId: string): void {
    this._pollSub = interval(3000)
      .pipe(
        switchMap(() => this.forecastService.pollJob(jobId)),
        takeWhile((res) => res.status === 'processing', true),
        takeUntil(this._destroy$),
      )
      .subscribe({
        next: (res) => { if (res.status !== 'processing') this._handleResult(res); },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error', summary: 'Polling Failed',
            detail: 'Could not retrieve forecast job result.',
          });
          this.cdr.markForCheck();
        },
      });
  }

  private _handleResult(res: ForecastResponse): void {
    if (res.status === 'failed') {
      this.loading = false;
      this.messageService.add({
        severity: 'error', summary: 'Forecast Failed',
        detail: res.error ?? 'Model execution failed.',
      });
      this.cdr.markForCheck();
      return;
    }
    this.forecastResult = res;
    this.loading = false;
    this.cdr.markForCheck();
    setTimeout(() => this._renderPlotly(), 100);
  }

  private _renderPlotly(): void {
    if (!this.forecastResult?.plotly_json || !this.plotlyChartRef) return;
    try {
      const fig = this.forecastResult.plotly_json;
      const layout = {
        ...(fig.layout ?? {}),
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#94a3b8', family: 'DM Sans, sans-serif' },
        xaxis: { ...(fig.layout?.xaxis ?? {}), gridcolor: 'rgba(148,163,184,0.1)', linecolor: 'rgba(148,163,184,0.2)' },
        yaxis: { ...(fig.layout?.yaxis ?? {}), gridcolor: 'rgba(148,163,184,0.1)', linecolor: 'rgba(148,163,184,0.2)' },
        legend: { bgcolor: 'transparent' },
        margin: { t: 40, b: 60, l: 60, r: 20 },
      };
      Plotly.newPlot(
        this.plotlyChartRef.nativeElement,
        fig.data ?? [],
        layout,
        { responsive: true, displayModeBar: true, displaylogo: false },
      );
      this.chartRendered = true;
      this.cdr.markForCheck();
    } catch (e) {
      console.error('Plotly render error:', e);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────

  private _fmt(d: Date): string { return d.toISOString().split('T')[0]; }

  private _addDays(d: Date, days: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + days);
    return r;
  }

  private _buildYearOptions(): YearOption[] {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({ label: String(current - i), value: current - i }));
  }

  metricLabel(key: string): string {
    const map: Record<string, string> = { mae: 'MAE', rmse: 'RMSE', r2: 'R²', r_squared: 'R²', mape: 'MAPE', mse: 'MSE' };
    return map[key.toLowerCase()] ?? key.toUpperCase();
  }

  metricDescription(key: string): string {
    const map: Record<string, string> = {
      mae: 'Mean Absolute Error', rmse: 'Root Mean Squared Error',
      r2: 'Coefficient of Determination', r_squared: 'Coefficient of Determination',
      mape: 'Mean Absolute Percentage Error', mse: 'Mean Squared Error',
    };
    return map[key.toLowerCase()] ?? key;
  }

  metricIcon(key: string): string {
    const map: Record<string, string> = {
      mae: 'pi-chart-line', rmse: 'pi-chart-bar',
      r2: 'pi-percentage', r_squared: 'pi-percentage', mape: 'pi-percentage',
    };
    return map[key.toLowerCase()] ?? 'pi-info-circle';
  }

  formatMetricValue(key: string, value: number): string {
    const k = key.toLowerCase();
    if (k === 'r2' || k === 'r_squared') return value.toFixed(4);
    if (k === 'mape' || k === 'mean_absolute_percentage_error') return `${(value * 100).toFixed(2)}%`;
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(value);
  }
}
