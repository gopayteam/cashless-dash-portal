import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';

import { Router } from '@angular/router';
import { DataService } from '../../../../@core/api/data.service';
import { API_ENDPOINTS } from '../../../../@core/api/endpoints';
import { AuthService } from '../../../../@core/services/auth.service';
import { LoadingStore } from '../../../../@core/state/loading.store';
import { ActionButtonComponent } from "../../../components/action-button/action-button";

interface StkTransaction {
  amount: string;
  createdAt: string;
  mpesaReceiptNumber: string;
}

@Component({
  selector: 'app-unassigned-stk-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    ActionButtonComponent
  ],
  providers: [MessageService],
  templateUrl: './unassigned-stk-transactions.html',
  styleUrls: ['./unassigned-stk-transactions.css', '../../../../styles/global/_toast.css']
})
export class UnassignedStkTransactionsComponent implements OnInit {
  entityId: string | null = null;
  transactions: StkTransaction[] = [];

  totalRecords = 0;
  rows = 10;
  first = 0;

  get loading() {
    return this.loadingStore.loading;
  }

  selectedDate = new Date();

  displayPublishDialog = false;

  selectedTransaction: StkTransaction | null = null;

  searchQuery = '';

  publishPayload = {
    entityId: this.entityId,
    fleetNumber: '',
    username: '',
    phoneNumber: ''
  };

  constructor(
    private dataService: DataService,
    private messageService: MessageService,
    private router: Router,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    public loadingStore: LoadingStore,
  ) { }

  ngOnInit(): void {

    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.entityId = user.entityId;

  }

  searchTransaction(): void {

    if (!this.searchQuery) {
      this.loadTransactions();
      return;
    }

    const payload = {
      mpesaReceiptNumber: this.searchQuery.trim().toUpperCase()
    };

    this.loadingStore.start();

    this.dataService
      .post<any>(
        API_ENDPOINTS.SEARCH_TRANSACTION,
        payload,
        'search-stk',
        true
      )
      .subscribe({
        next: (response) => {

          if (response.data) {
            this.transactions = [response.data];
            this.totalRecords = 1;
          } else {
            this.transactions = [];
            this.totalRecords = 0;
            this.messageService.add({
              severity: 'info',
              summary: 'Info',
              detail: 'No transaction found'
            });
          }

          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        error: (err) => {

          console.error(err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to search transaction'
          });
          this.loadingStore.stop();
        }
      });
  }

  loadTransactions(event?: any): void {

    const page = event ? event.first / event.rows : 0;
    const size = event ? event.rows : this.rows;

    const payload = {
      createdAt: this.formatDate(this.selectedDate),
      page,
      size
    };

    // this.loading = true;
    this.loadingStore.start();

    this.dataService
      .post<any>(
        API_ENDPOINTS.UNASSIGNED_STK_TRANSACTIONS,
        payload,
        'stk-no-fleet',
        true
      )
      .subscribe({
        next: (response) => {

          this.transactions = response.data || [];
          this.totalRecords = response.totalRecords || 0;
          this.cdr.detectChanges();
          this.loadingStore.stop();
        },
        error: (err) => {

          console.error(err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load STK transactions'
          });
          this.loadingStore.stop();
        }
      });
  }

  openPublishDialog(transaction: StkTransaction): void {

    this.selectedTransaction = transaction;

    this.publishPayload = {
      entityId: this.entityId || '',
      fleetNumber: '',
      username: '',
      phoneNumber: ''
    };

    this.displayPublishDialog = true;
  }

  publishTransaction(): void {

    if (!this.selectedTransaction) {
      return;
    }

    if (!this.publishPayload.fleetNumber) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Fleet number is required'
      });
      return;
    }

    const payload = {
      mpesaReceiptNumber:
        this.selectedTransaction.mpesaReceiptNumber,

      amount:
        this.selectedTransaction.amount,

      entityId:
        this.publishPayload.entityId,

      fleetNumber:
        this.publishPayload.fleetNumber,

      username:
        this.publishPayload.username || '2547960110105',

      phoneNumber:
        this.publishPayload.phoneNumber || '2547960110105'
    };

    this.dataService
      .post<any>(
        'https://api.gopay.ke',
        payload,
        'publish-stk',
        true
      )
      .subscribe({
        next: () => {

          this.displayPublishDialog = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Transaction published successfully'
          });

          this.loadTransactions();
        },
        error: (err) => {

          console.error(err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to publish transaction'
          });
        }
      });
  }

  private formatDate(date: Date): string {

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  refresh(): void {
    this.loadTransactions();
  }
}