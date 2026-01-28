import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateParcelManagerComponent as UpdateParcelManager } from './update-parcel-manager';

describe('UpdateParcelManager', () => {
  let component: UpdateParcelManager;
  let fixture: ComponentFixture<UpdateParcelManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateParcelManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateParcelManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
