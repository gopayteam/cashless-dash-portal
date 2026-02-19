import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatReservation } from './seat-reservation';

describe('SeatReservation', () => {
  let component: SeatReservation;
  let fixture: ComponentFixture<SeatReservation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatReservation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatReservation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
