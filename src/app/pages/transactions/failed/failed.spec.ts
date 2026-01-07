import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Failed } from './failed';

describe('Failed', () => {
  let component: Failed;
  let fixture: ComponentFixture<Failed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Failed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Failed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
