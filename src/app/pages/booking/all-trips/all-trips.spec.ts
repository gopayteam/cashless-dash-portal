import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTrips } from './all-trips';

describe('AllTrips', () => {
  let component: AllTrips;
  let fixture: ComponentFixture<AllTrips>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllTrips]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllTrips);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
