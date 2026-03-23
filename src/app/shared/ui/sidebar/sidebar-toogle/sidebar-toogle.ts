import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar-toogle',
  imports: [MatIconModule],
  template: `
    <mat-icon>{{ collapsed ? 'chevron_right' : 'chevron_left' }}</mat-icon>
  `,
  host: {
    class: 'ds-sidenav-toggle',
    '(click)': 'toggled.emit()',
  },
})
export class SidebarToogle {

  @Input()  collapsed = false;
  @Output() toggled    = new EventEmitter<void>();
}


