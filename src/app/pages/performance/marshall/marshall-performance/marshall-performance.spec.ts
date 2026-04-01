import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarshalPerformanceComponent as MarshallPerformance } from './marshall-performance';

describe('MarshallPerformance', () => {
  let component: MarshallPerformance;
  let fixture: ComponentFixture<MarshallPerformance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarshallPerformance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarshallPerformance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
