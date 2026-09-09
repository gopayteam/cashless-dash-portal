import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentSourceTransactionsComponent as PaymentSourceTransactions } from './payment-source-transactions';

describe('PaymentSourceTransactions', () => {
  let component: PaymentSourceTransactions;
  let fixture: ComponentFixture<PaymentSourceTransactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentSourceTransactions],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentSourceTransactions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
