import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarToogle } from './sidebar-toogle';

describe('SidebarToogle', () => {
  let component: SidebarToogle;
  let fixture: ComponentFixture<SidebarToogle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarToogle],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarToogle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
