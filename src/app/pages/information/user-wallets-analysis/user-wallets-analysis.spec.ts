import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserWalletsAnalysisComponent as UserWalletsAnalysis } from './user-wallets-analysis';

describe('UserWalletsAnalysis', () => {
  let component: UserWalletsAnalysis;
  let fixture: ComponentFixture<UserWalletsAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserWalletsAnalysis]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UserWalletsAnalysis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
