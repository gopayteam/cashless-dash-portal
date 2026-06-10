import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnassignedStkTransactionsComponent as UnassignedStkTransactions } from './unassigned-stk-transactions';

describe('UnassignedStkTransactions', () => {
  let component: UnassignedStkTransactions;
  let fixture: ComponentFixture<UnassignedStkTransactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnassignedStkTransactions]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UnassignedStkTransactions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
