import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StagePerformance } from './stage-performance';

describe('StagePerformance', () => {
  let component: StagePerformance;
  let fixture: ComponentFixture<StagePerformance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StagePerformance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StagePerformance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
