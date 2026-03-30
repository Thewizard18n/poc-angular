import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Sidebar, SidebarItem } from '../../../shared/ui';
import { navigationConfig } from '../../navigation/navigation.config';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavItem } from '../../../shared/ui/sidebar/sidebar';
import { filter } from 'rxjs';
import { ContextToolbar } from '../context-toolbar/context-toolbar';

@Component({
  selector: 'app-sidenav',
  imports: [Sidebar, SidebarItem, RouterOutlet, ContextToolbar],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
})
export class Sidenav {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // estado local — ninguém acima precisa saber
  readonly collapsed = signal(false);
  readonly activeItem = signal<string | null>(null);

  readonly items = navigationConfig;

  constructor() {
    this.syncActiveItemFromUrl(this.router.url);
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.syncActiveItemFromUrl(event.urlAfterRedirects);
      });
  }

  onItemClicked(item: NavItem) {
    this.activeItem.set(item.module);

    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  private syncActiveItemFromUrl(url: string): void {
    const [basePath] = url.split('?');
    const segments = basePath.split('/').filter(Boolean);
    this.activeItem.set(segments[0] ?? null);
  }
}
