import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DsButton } from './ds-button';

describe('DsButton', () => {
  let component: DsButton;
  let fixture: ComponentFixture<DsButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DsButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DsButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
