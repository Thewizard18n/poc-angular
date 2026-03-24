import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Banana } from './banana';

describe('Banana', () => {
  let component: Banana;
  let fixture: ComponentFixture<Banana>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Banana],
    }).compileComponents();

    fixture = TestBed.createComponent(Banana);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
