import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationWallet } from './organization-wallet';

describe('OrganizationWallet', () => {
  let component: OrganizationWallet;
  let fixture: ComponentFixture<OrganizationWallet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationWallet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationWallet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
