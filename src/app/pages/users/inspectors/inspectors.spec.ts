import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectorsComponent as Inspectors } from './inspectors';

describe('Inspectors', () => {
  let component: Inspectors;
  let fixture: ComponentFixture<Inspectors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inspectors]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Inspectors);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
