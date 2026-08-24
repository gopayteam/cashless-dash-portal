import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lookup } from './lookup';

describe('Lookup', () => {
  let component: Lookup;
  let fixture: ComponentFixture<Lookup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Lookup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Lookup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
