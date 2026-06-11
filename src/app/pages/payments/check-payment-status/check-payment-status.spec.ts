import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentStatusCheckComponent as CheckPaymentStatus } from './check-payment-status';

describe('CheckPaymentStatus', () => {
  let component: CheckPaymentStatus;
  let fixture: ComponentFixture<CheckPaymentStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckPaymentStatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckPaymentStatus);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
