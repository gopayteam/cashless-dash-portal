import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashmastersComponent as Dashmasters } from './dashmasters';

describe('Dashmasters', () => {
  let component: Dashmasters;
  let fixture: ComponentFixture<Dashmasters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashmasters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashmasters);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
