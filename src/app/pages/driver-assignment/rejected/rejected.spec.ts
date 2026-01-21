import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllRejectedDriverAssignmentsComponent as Rejected } from './rejected';

describe('Rejected', () => {
  let component: Rejected;
  let fixture: ComponentFixture<Rejected>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rejected]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rejected);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
