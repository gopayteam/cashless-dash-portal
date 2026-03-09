import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntentManagementComponent as Intents } from './intent-management';

describe('Intents', () => {
  let component: Intents;
  let fixture: ComponentFixture<Intents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Intents]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Intents);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
