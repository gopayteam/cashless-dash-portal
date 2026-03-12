import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleAnalysisModal } from './vehicle-analysis-modal';

describe('VehicleAnalysisModal', () => {
  let component: VehicleAnalysisModal;
  let fixture: ComponentFixture<VehicleAnalysisModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleAnalysisModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleAnalysisModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
