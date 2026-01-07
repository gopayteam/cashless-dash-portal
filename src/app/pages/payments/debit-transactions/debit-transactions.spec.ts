import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebitTransactions } from './debit-transactions';

describe('DebitTransactions', () => {
  let component: DebitTransactions;
  let fixture: ComponentFixture<DebitTransactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebitTransactions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DebitTransactions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
