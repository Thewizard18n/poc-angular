import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Resumo } from './resumo';

describe('Resumo', () => {
  let component: Resumo;
  let fixture: ComponentFixture<Resumo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resumo],
    }).compileComponents();

    fixture = TestBed.createComponent(Resumo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
