import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Yearly } from './yearly';

describe('Yearly', () => {
  let component: Yearly;
  let fixture: ComponentFixture<Yearly>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Yearly]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Yearly);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
