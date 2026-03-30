import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Passagens } from './passagens';

describe('Passagens', () => {
  let component: Passagens;
  let fixture: ComponentFixture<Passagens>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Passagens],
    }).compileComponents();

    fixture = TestBed.createComponent(Passagens);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
