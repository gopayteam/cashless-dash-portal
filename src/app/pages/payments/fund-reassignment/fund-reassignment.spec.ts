import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundReassignment } from './fund-reassignment';

describe('FundReassignment', () => {
  let component: FundReassignment;
  let fixture: ComponentFixture<FundReassignment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundReassignment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundReassignment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
