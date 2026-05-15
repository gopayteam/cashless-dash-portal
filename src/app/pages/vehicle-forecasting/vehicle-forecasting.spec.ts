import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleForecasting } from './vehicle-forecasting';

describe('VehicleForecasting', () => {
  let component: VehicleForecasting;
  let fixture: ComponentFixture<VehicleForecasting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleForecasting]
    })
      .compileComponents();

    fixture = TestBed.createComponent(VehicleForecasting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
