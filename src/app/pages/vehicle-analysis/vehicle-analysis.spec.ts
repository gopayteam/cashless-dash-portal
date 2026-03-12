import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleAnalysisComponent as VehicleAnalysis } from './vehicle-analysis';

describe('VehicleAnalysis', () => {
  let component: VehicleAnalysis;
  let fixture: ComponentFixture<VehicleAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleAnalysis]
    })
      .compileComponents();

    fixture = TestBed.createComponent(VehicleAnalysis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
