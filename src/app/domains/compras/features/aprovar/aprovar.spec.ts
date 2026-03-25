import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Aprovar } from './aprovar';

describe('Aprovar', () => {
  let component: Aprovar;
  let fixture: ComponentFixture<Aprovar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Aprovar],
    }).compileComponents();

    fixture = TestBed.createComponent(Aprovar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
