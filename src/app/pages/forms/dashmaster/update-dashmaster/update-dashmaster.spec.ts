import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateDashmaster } from './update-dashmaster';

describe('UpdateDashmaster', () => {
  let component: UpdateDashmaster;
  let fixture: ComponentFixture<UpdateDashmaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateDashmaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateDashmaster);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
