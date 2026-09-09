import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentSourceBreakdownWidget } from './payment-source-breakdown-widget';

describe('PaymentSourceBreakdownWidget', () => {
  let component: PaymentSourceBreakdownWidget;
  let fixture: ComponentFixture<PaymentSourceBreakdownWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentSourceBreakdownWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentSourceBreakdownWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
