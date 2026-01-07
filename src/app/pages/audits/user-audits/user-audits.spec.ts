import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAudits } from './user-audits';

describe('UserAudits', () => {
  let component: UserAudits;
  let fixture: ComponentFixture<UserAudits>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAudits]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAudits);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
