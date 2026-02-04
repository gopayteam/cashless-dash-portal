import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateVehicle } from './update-vehicle';

describe('UpdateVehicle', () => {
  let component: UpdateVehicle;
  let fixture: ComponentFixture<UpdateVehicle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateVehicle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateVehicle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
