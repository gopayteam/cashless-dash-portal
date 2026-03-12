import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShortTerm } from './short-term';

describe('ShortTerm', () => {
  let component: ShortTerm;
  let fixture: ComponentFixture<ShortTerm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShortTerm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShortTerm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
