import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendNotificationsComponent as SendNotifications } from './send-notifications';

describe('SendNotifications', () => {
  let component: SendNotifications;
  let fixture: ComponentFixture<SendNotifications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendNotifications]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SendNotifications);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
