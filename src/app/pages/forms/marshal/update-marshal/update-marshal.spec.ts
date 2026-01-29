import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateMarshal } from './update-marshal';

describe('UpdateMarshal', () => {
  let component: UpdateMarshal;
  let fixture: ComponentFixture<UpdateMarshal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateMarshal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateMarshal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
