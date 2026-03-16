import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Weekly } from './weekly';

describe('Weekly', () => {
  let component: Weekly;
  let fixture: ComponentFixture<Weekly>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Weekly]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Weekly);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
