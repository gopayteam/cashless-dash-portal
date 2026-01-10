import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParcelDestination } from './parcel-destination';

describe('ParcelDestination', () => {
  let component: ParcelDestination;
  let fixture: ComponentFixture<ParcelDestination>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelDestination]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParcelDestination);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
