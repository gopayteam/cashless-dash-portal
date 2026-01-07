import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Parcels } from '../parcels';

describe('Parcels', () => {
  let component: Parcels;
  let fixture: ComponentFixture<Parcels>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Parcels]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Parcels);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
