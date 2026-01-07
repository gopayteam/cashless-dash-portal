import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Marshals } from './marshals';

describe('Marshals', () => {
  let component: Marshals;
  let fixture: ComponentFixture<Marshals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Marshals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Marshals);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
