import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParcelOffices } from './parcel-offices';

describe('ParcelOffices', () => {
  let component: ParcelOffices;
  let fixture: ComponentFixture<ParcelOffices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelOffices]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParcelOffices);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
