import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateApprover } from './update-approver';

describe('UpdateApprover', () => {
  let component: UpdateApprover;
  let fixture: ComponentFixture<UpdateApprover>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateApprover]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateApprover);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
