import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationBalanceComponent as OrganizationBalance } from './organization-balance';

describe('OrganizationBalance', () => {
  let component: OrganizationBalance;
  let fixture: ComponentFixture<OrganizationBalance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationBalance]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OrganizationBalance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
