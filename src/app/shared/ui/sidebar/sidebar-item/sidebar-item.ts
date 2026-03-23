import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sidebar-item',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <div class="ds-sidenav-item-icon"
         [matTooltip]="collapsed ? label : ''"
         matTooltipPosition="right">
      <mat-icon>{{ icon }}</mat-icon>
    </div>
    <span class="ds-sidenav-item-label">{{ label }}</span>
    @if (badge) {
      <span class="ds-sidenav-item-badge">{{ badge }}</span>
    }
  `,
  host: {
    class: 'ds-sidenav-item',
    '[class.active]': 'active',
  },
})
export class SidebarItem {
  @Input({ required: true }) icon  = '';
  @Input({ required: true }) label = '';
  @Input() badge?:    number;
  @Input() active   = false;
  @Input() collapsed = false;
}
