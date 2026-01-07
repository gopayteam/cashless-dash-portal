import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Conductors } from './conductors';

describe('Conductors', () => {
  let component: Conductors;
  let fixture: ComponentFixture<Conductors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Conductors]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Conductors);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
