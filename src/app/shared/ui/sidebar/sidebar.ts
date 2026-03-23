import { NgClass } from '@angular/common';
import { Component, Input, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';


export interface NavItem {
  label: string;
  icon: string;
  module: string;
  route?: string;    // rota direta (sem sub-sidebar)
  badge?: number;
  hasSub?: boolean;  // abre sub-sidebar ao invés de navegar
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  template: `<ng-content />`,
  styleUrl: './sidebar.scss',
  host: {
    class: 'ds-sidenav',
    '[class.ds-sidenav--collapsed]': 'collapsed',
    '[class.ds-sidenav--sub]': 'sub',
  },
})
export class Sidebar {
  @Input() collapsed = false;
  @Input() sub       = false;  
}
