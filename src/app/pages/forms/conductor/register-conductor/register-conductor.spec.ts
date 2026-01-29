import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterConductor } from './register-conductor';

describe('RegisterConductor', () => {
  let component: RegisterConductor;
  let fixture: ComponentFixture<RegisterConductor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterConductor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterConductor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
