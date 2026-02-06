import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletedParcelsComponent as DeletedParcels } from './deleted-parcels';

describe('DeletedParcels', () => {
  let component: DeletedParcels;
  let fixture: ComponentFixture<DeletedParcels>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletedParcels]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DeletedParcels);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
