import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarshallDetails } from './marshall-details';

describe('MarshallDetails', () => {
  let component: MarshallDetails;
  let fixture: ComponentFixture<MarshallDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarshallDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarshallDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
