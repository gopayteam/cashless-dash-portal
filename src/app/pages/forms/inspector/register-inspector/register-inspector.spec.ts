import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterInspector } from './register-inspector';

describe('RegisterInspector', () => {
  let component: RegisterInspector;
  let fixture: ComponentFixture<RegisterInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterInspector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterInspector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
