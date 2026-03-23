import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiContainer } from './ui-container';

describe('UiContainer', () => {
  let component: UiContainer;
  let fixture: ComponentFixture<UiContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiContainer],
    }).compileComponents();

    fixture = TestBed.createComponent(UiContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
