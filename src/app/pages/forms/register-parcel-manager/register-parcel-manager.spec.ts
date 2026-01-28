import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterParcelManager } from './register-parcel-manager';

describe('RegisterParcelManager', () => {
  let component: RegisterParcelManager;
  let fixture: ComponentFixture<RegisterParcelManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterParcelManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterParcelManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
