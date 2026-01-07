import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverAssignment } from './driver-assignment';

describe('DriverAssignment', () => {
  let component: DriverAssignment;
  let fixture: ComponentFixture<DriverAssignment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverAssignment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverAssignment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
