import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParcelStagesContact } from './parcel-stages-contact';

describe('ParcelStagesContact', () => {
  let component: ParcelStagesContact;
  let fixture: ComponentFixture<ParcelStagesContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelStagesContact]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParcelStagesContact);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
