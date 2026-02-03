import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproversComponent as Approvers } from './approvers';

describe('Approvers', () => {
  let component: Approvers;
  let fixture: ComponentFixture<Approvers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Approvers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Approvers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
