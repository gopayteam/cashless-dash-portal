import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatWidgetComponent as Widget } from './chat-widget';

describe('Widget', () => {
  let component: Widget;
  let fixture: ComponentFixture<Widget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Widget]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Widget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
