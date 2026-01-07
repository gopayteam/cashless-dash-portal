import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Statements } from './statements';

describe('Statements', () => {
  let component: Statements;
  let fixture: ComponentFixture<Statements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Statements]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Statements);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
