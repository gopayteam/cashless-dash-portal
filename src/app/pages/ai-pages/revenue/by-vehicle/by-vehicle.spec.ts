import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ByVehicle } from './by-vehicle';

describe('ByVehicle', () => {
  let component: ByVehicle;
  let fixture: ComponentFixture<ByVehicle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ByVehicle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ByVehicle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
