import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateInspector } from './update-inspector';

describe('UpdateInspector', () => {
  let component: UpdateInspector;
  let fixture: ComponentFixture<UpdateInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateInspector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateInspector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
