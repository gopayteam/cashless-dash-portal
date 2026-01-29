import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterInvestor } from './register-investor';

describe('RegisterInvestor', () => {
  let component: RegisterInvestor;
  let fixture: ComponentFixture<RegisterInvestor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterInvestor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterInvestor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
