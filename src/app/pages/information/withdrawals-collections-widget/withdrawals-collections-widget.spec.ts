import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithdrawalsCollectionsWidget } from './withdrawals-collections-widget';

describe('WithdrawalsCollectionsWidget', () => {
  let component: WithdrawalsCollectionsWidget;
  let fixture: ComponentFixture<WithdrawalsCollectionsWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WithdrawalsCollectionsWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(WithdrawalsCollectionsWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
