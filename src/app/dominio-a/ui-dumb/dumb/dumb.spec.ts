import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dumb } from './dumb';

describe('Dumb', () => {
  let component: Dumb;
  let fixture: ComponentFixture<Dumb>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dumb]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dumb);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
