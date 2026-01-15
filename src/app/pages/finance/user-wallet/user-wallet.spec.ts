import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserWallet } from './user-wallet';

describe('UserWallet', () => {
  let component: UserWallet;
  let fixture: ComponentFixture<UserWallet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserWallet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserWallet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
