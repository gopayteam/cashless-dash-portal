import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissedTransactionComponent as MissedTransactions } from './missed-transactions';

describe('MissedTransactions', () => {
  let component: MissedTransactions;
  let fixture: ComponentFixture<MissedTransactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissedTransactions]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MissedTransactions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
