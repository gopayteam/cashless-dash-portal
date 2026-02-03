import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParcelReceipt } from './parcel-receipt';

describe('ParcelReceipt', () => {
  let component: ParcelReceipt;
  let fixture: ComponentFixture<ParcelReceipt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelReceipt]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParcelReceipt);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
