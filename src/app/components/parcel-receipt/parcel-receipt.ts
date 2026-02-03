import { Component, Input } from '@angular/core';
import { Parcel } from '../../../@core/models/parcels/parcel.model';
import { DatePipe } from '@angular/common';
import { DecimalPipe } from '@angular/common';
// import { CurrencyPipe } from '@angular/common';
// import { PercentPipe } from '@angular/common';


@Component({
  selector: 'app-parcel-receipt',
  imports: [
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './parcel-receipt.html',
  styleUrl: './parcel-receipt.css',
})
export class ParcelReceiptComponent {
  @Input() parcel!: Parcel;
  today = new Date();

  getStatusClass(status: string) {
    switch (status) {
      case 'COLLECTED':
        return 'badge-success';
      case 'IN_TRANSIT':
        return 'badge-warning';
      case 'ARRIVED':
        return 'badge-info';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-default';
    }
  }

  getPaymentStatusClass(status: string) {
    switch (status) {
      case 'PAID':
        return 'badge-success';
      case 'PENDING':
        return 'badge-warning';
      case 'UNPAID':
        return 'badge-danger';
      default:
        return 'badge-default';
    }
  }

  getPaymentMethodClass(method: string) {
    switch (method) {
      case 'CASH':
        return 'badge-primary';
      case 'CASHLESS':
        return 'badge-secondary';
      default:
        return 'badge-default';
    }
  }

}