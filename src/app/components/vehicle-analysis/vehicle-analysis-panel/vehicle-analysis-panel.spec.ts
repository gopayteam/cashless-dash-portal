import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleAnalysisPanel } from './vehicle-analysis-panel';

describe('VehicleAnalysisPanel', () => {
  let component: VehicleAnalysisPanel;
  let fixture: ComponentFixture<VehicleAnalysisPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleAnalysisPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleAnalysisPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
