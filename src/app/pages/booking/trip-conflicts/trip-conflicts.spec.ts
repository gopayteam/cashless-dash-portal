import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConflictDashboardComponent as TripConflicts } from './trip-conflicts';

describe('TripConflicts', () => {
  let component: TripConflicts;
  let fixture: ComponentFixture<TripConflicts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripConflicts]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TripConflicts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
