import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParcelSource } from './parcel-source';

describe('ParcelSource', () => {
  let component: ParcelSource;
  let fixture: ComponentFixture<ParcelSource>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelSource]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParcelSource);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
