import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateAdmin } from './update-admin';

describe('UpdateAdmin', () => {
  let component: UpdateAdmin;
  let fixture: ComponentFixture<UpdateAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
