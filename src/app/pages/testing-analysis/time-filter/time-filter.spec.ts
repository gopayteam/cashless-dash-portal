import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeFilter } from './time-filter';

describe('TimeFilter', () => {
  let component: TimeFilter;
  let fixture: ComponentFixture<TimeFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeFilter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
