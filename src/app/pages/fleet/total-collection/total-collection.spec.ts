import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FleetCollectionsComponent as TotalCollection } from './total-collection';

describe('TotalCollection', () => {
  let component: TotalCollection;
  let fixture: ComponentFixture<TotalCollection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalCollection]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TotalCollection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
