import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionsAnalysis } from './transactions-analysis';

describe('TransactionsAnalysis', () => {
  let component: TransactionsAnalysis;
  let fixture: ComponentFixture<TransactionsAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionsAnalysis]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TransactionsAnalysis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
