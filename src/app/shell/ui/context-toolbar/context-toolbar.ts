import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink } from '@angular/router';
import {
  ToolbarTab,
  ToolbarTabGroup,
  ToolbarTabLink,
  toolbarTabsConfig,
} from '../../navigation/toolbar-tabs.config';

@Component({
  selector: 'app-context-toolbar',
  imports: [MatTabsModule, MatMenuModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './context-toolbar.html',
  styleUrl: './context-toolbar.scss',
})
export class ContextToolbar {
  private readonly router = inject(Router);

  readonly module = input<string | null>(null);

  readonly tabs = computed<ToolbarTab[]>(() => {
    const module = this.module();
    if (!module) {
      return [];
    }
    return toolbarTabsConfig[module] ?? [];
  });

  isLink(tab: ToolbarTab): tab is ToolbarTabLink {
    return tab.type === 'link';
  }

  isGroup(tab: ToolbarTab): tab is ToolbarTabGroup {
    return tab.type === 'group';
  }

  isRouteActive(route: string): boolean {
    return this.getBestActiveRoute() === this.normalizeRoute(route);
  }

  isGroupActive(group: ToolbarTabGroup): boolean {
    return group.children.some((child) => this.isRouteActive(child.route));
  }

  private getBestActiveRoute(): string | null {
    const currentPath = this.normalizeRoute(this.router.url.split('?')[0].split('#')[0]);
    const links = this.tabs().flatMap((tab) => (tab.type === 'group' ? tab.children : [tab]));

    let bestRoute: string | null = null;
    let bestLength = -1;

    for (const link of links) {
      const candidate = this.normalizeRoute(link.route);
      if (!this.matchesRoute(currentPath, candidate)) {
        continue;
      }

      if (candidate.length > bestLength) {
        bestRoute = candidate;
        bestLength = candidate.length;
      }
    }

    return bestRoute;
  }

  private matchesRoute(currentPath: string, candidateRoute: string): boolean {
    return (
      currentPath === candidateRoute || currentPath.startsWith(`${candidateRoute}/`)
    );
  }

  private normalizeRoute(route: string): string {
    if (!route) {
      return '/';
    }
    const noTrailingSlash = route.endsWith('/') && route !== '/' ? route.slice(0, -1) : route;
    return noTrailingSlash.startsWith('/') ? noTrailingSlash : `/${noTrailingSlash}`;
  }
}
