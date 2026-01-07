import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LongTerm } from './long-term';

describe('LongTerm', () => {
  let component: LongTerm;
  let fixture: ComponentFixture<LongTerm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LongTerm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LongTerm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
