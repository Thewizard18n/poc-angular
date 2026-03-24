import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Maca } from './maca';

describe('Maca', () => {
  let component: Maca;
  let fixture: ComponentFixture<Maca>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Maca],
    }).compileComponents();

    fixture = TestBed.createComponent(Maca);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
