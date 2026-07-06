import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmsBroadcast } from './sms-broadcast';

describe('SmsBroadcast', () => {
  let component: SmsBroadcast;
  let fixture: ComponentFixture<SmsBroadcast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmsBroadcast]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmsBroadcast);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
