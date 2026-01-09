import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTransactionsComponent } from './all';

describe('All', () => {
  let component: AllTransactionsComponent;
  let fixture: ComponentFixture<AllTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllTransactionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllTransactionsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
