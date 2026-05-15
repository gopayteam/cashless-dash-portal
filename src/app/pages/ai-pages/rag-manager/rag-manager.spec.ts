import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RagManagerComponent as RagManager } from './rag-manager';

describe('RagManager', () => {
  let component: RagManager;
  let fixture: ComponentFixture<RagManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RagManager]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RagManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
