import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletAnalyticsComponent as WalletAnalytics } from './wallet-analytics';

describe('WalletAnalytics', () => {
  let component: WalletAnalytics;
  let fixture: ComponentFixture<WalletAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WalletAnalytics]
    })
      .compileComponents();

    fixture = TestBed.createComponent(WalletAnalytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
