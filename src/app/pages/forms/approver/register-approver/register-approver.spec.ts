import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterApprover } from './register-approver';

describe('RegisterApprover', () => {
  let component: RegisterApprover;
  let fixture: ComponentFixture<RegisterApprover>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterApprover]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterApprover);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
