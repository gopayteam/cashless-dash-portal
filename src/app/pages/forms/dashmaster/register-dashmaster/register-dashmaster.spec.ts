import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterDashmaster } from './register-dashmaster';

describe('RegisterDashmaster', () => {
  let component: RegisterDashmaster;
  let fixture: ComponentFixture<RegisterDashmaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterDashmaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterDashmaster);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
