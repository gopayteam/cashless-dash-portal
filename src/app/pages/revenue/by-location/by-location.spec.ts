import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ByLocation } from './by-location';

describe('ByLocation', () => {
  let component: ByLocation;
  let fixture: ComponentFixture<ByLocation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ByLocation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ByLocation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
