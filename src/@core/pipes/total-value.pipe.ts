import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'totalValue', standalone: true })
export class TotalValuePipe implements PipeTransform {
  transform(buckets: any[]): number {
    return buckets.reduce((sum, b) => sum + b.totalValue, 0);
  }
}

@Pipe({ name: 'totalAmount', standalone: true })
export class TotalAmountPipe implements PipeTransform {
  transform(buckets: any[]): number {
    return buckets.reduce((sum, b) => sum + b.totalAmount, 0);
  }
}
