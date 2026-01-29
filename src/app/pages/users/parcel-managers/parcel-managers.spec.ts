import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParcelManagers } from './parcel-managers';

describe('ParcelManagers', () => {
  let component: ParcelManagers;
  let fixture: ComponentFixture<ParcelManagers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelManagers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParcelManagers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
