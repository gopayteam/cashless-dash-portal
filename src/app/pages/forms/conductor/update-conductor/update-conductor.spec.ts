import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateConductor } from './update-conductor';

describe('UpdateConductor', () => {
  let component: UpdateConductor;
  let fixture: ComponentFixture<UpdateConductor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateConductor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateConductor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
