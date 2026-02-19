import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripTransactions } from './trip-transactions';

describe('TripTransactions', () => {
  let component: TripTransactions;
  let fixture: ComponentFixture<TripTransactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripTransactions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripTransactions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
