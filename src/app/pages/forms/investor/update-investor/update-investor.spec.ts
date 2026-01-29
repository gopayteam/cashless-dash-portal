import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateInvestorComponent as UpdateInvestor } from './update-investor';

describe('UpdateInvestor', () => {
  let component: UpdateInvestor;
  let fixture: ComponentFixture<UpdateInvestor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateInvestor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateInvestor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
