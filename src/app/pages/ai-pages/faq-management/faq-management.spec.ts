import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaqManagement } from './faq-management';

describe('FaqManagement', () => {
  let component: FaqManagement;
  let fixture: ComponentFixture<FaqManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaqManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
