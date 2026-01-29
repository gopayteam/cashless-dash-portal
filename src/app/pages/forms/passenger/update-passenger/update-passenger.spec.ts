import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePassenger } from './update-passenger';

describe('UpdatePassenger', () => {
  let component: UpdatePassenger;
  let fixture: ComponentFixture<UpdatePassenger>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePassenger]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePassenger);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
