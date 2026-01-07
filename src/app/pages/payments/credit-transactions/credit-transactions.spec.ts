import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditTransactions } from './credit-transactions';

describe('CreditTransactions', () => {
  let component: CreditTransactions;
  let fixture: ComponentFixture<CreditTransactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditTransactions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreditTransactions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
