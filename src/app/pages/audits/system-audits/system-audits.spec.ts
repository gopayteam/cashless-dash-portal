import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemAudits } from './system-audits';

describe('SystemAudits', () => {
  let component: SystemAudits;
  let fixture: ComponentFixture<SystemAudits>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemAudits]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemAudits);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
