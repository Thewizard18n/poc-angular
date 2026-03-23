import { Component, inject, input, output, signal } from '@angular/core';
import { Sidebar, SidebarToogle, SidebarItem } from "../../../shared/ui";
import { navigationConfig } from '../../navigation/navigation.config';
import { Router, RouterOutlet } from '@angular/router';
import { NavItem } from '../../../shared/ui/sidebar/sidebar';

@Component({
  selector: 'app-sidenav',
  imports: [Sidebar, SidebarToogle, SidebarItem, RouterOutlet],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
})
export class Sidenav {

  private router = inject(Router);

  // estado local — ninguém acima precisa saber
  readonly collapsed   = signal(false);
  readonly activeItem  = signal<string | null>(null);

  readonly items = navigationConfig;

  onItemClicked(item: NavItem) {
    this.activeItem.set(item.module);

    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

}
