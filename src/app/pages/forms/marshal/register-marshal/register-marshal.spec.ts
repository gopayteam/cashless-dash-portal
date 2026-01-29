import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterMarshal } from './register-marshal';

describe('RegisterMarshal', () => {
  let component: RegisterMarshal;
  let fixture: ComponentFixture<RegisterMarshal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterMarshal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterMarshal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
