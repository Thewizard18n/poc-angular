// src/app/shared/ui/ds-toolbar/ds-toolbar.component.ts
import {
Component,
input,
output,
ChangeDetectionStrategy
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/\*\*

- Wrapper do mat-toolbar com tokens do design system.
- Genérico — sem conhecimento de navegação ou domínios.
- @example
- <ds-toolbar title="Minha App" (menuClick)="onMenu()" />
  _/
  @Component({
  selector: 'ds-toolbar',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `     <mat-toolbar [style.background]="'var(--color-toolbar-bg)'"
                 [style.color]="'var(--color-text-on-primary)'"
                 [style.height]="'var(--toolbar-height)'">
      <button mat-icon-button (click)="menuClick.emit()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="title">{{ title() }}</span>
      <span class="spacer"></span>
      <ng-content></ng-content>
    </mat-toolbar>
  `,
  styles: [`
  .title {
  font-size: var(--font-size-lg);
  font-weight: 500;
  margin-left: var(--spacing-sm);
  }
  .spacer { flex: 1; }
  `]
  })
  export class DsToolbarComponent {
  /\*\* Título exibido na toolbar _/
  title = input<string>('');
  /\*_ Emite quando o botão de menu é clicado _/
  menuClick = output<void>();
  }

sidenav

// src/app/shared/ui/ds-sidenav/ds-sidenav.component.ts
import {
Component,
input,
ChangeDetectionStrategy
} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';

/\*\*

- Wrapper do mat-sidenav com tokens do design system.
- Genérico — sem conhecimento de navegação ou domínios.
- @example
- <ds-sidenav [opened]="opened()">conteúdo</ds-sidenav>
  _/
  @Component({
  selector: 'ds-sidenav',
  standalone: true,
  imports: [MatSidenavModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `     <mat-sidenav
      [opened]="opened()"
      [mode]="mode()"
      [style.width]="'var(--sidenav-width)'"
      [style.background]="'var(--color-sidenav-bg)'"
      [style.border-right]="'1px solid var(--color-border)'">
      <ng-content></ng-content>
    </mat-sidenav>
  `
  })
  export class DsSidenavComponent {
  /\*\* Controla se o sidenav está aberto _/
  opened = input<boolean>(true);
  /\*_ Modo do sidenav _/
  mode = input<'side' | 'over' | 'push'>('side');
  }

criar navigation

// src/app/shell/navigation/navigation.config.ts
export interface FeatureNav {
label: string;
route: string;
icon: string;
}

export interface DomainNav {
id: string;
label: string;
icon: string;
features: FeatureNav[];
}

export const NAVIGATION: DomainNav[] = [
{
id: 'products',
label: 'Produtos',
icon: 'inventory_2',
features: [
{ label: 'Lista', route: '/products/list', icon: 'list' },
{ label: 'Detalhe', route: '/products/detail/1', icon: 'info' },
]
},
{
id: 'orders',
label: 'Pedidos',
icon: 'shopping_cart',
features: [
{ label: 'Lista', route: '/orders/list', icon: 'list' },
]
}
];

// src/app/shell/layout/shell-layout.component.ts
import {
Component,
signal,
ChangeDetectionStrategy
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { DsToolbarComponent, DsFooterComponent } from '../../shared/ui';
import { NAVIGATION, DomainNav } from '../navigation/navigation.config';

@Component({
selector: 'app-shell-layout',
standalone: true,
changeDetection: ChangeDetectionStrategy.OnPush,
imports: [
RouterOutlet,
RouterLink,
RouterLinkActive,
MatSidenavModule,
MatListModule,
MatIconModule,
MatButtonModule,
MatExpansionModule,
DsToolbarComponent,
DsFooterComponent,
],
template: `
<div class="shell">
<ds-toolbar
title="POC Angular"
(menuClick)="toggleSidenav()">
</ds-toolbar>

      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav
          [opened]="sidenavOpen()"
          mode="side"
          class="sidenav">

          <mat-accordion [multi]="false">
            @for (domain of navigation; track domain.id) {
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon class="domain-icon">{{ domain.icon }}</mat-icon>
                    {{ domain.label }}
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <mat-nav-list>
                  @for (feature of domain.features; track feature.route) {
                    <a mat-list-item
                       [routerLink]="feature.route"
                       routerLinkActive="active-link">
                      <mat-icon matListItemIcon>{{ feature.icon }}</mat-icon>
                      {{ feature.label }}
                    </a>
                  }
                </mat-nav-list>
              </mat-expansion-panel>
            }
          </mat-accordion>

        </mat-sidenav>

        <mat-sidenav-content class="content">
          <main class="main">
            <router-outlet></router-outlet>
          </main>
          <ds-footer>POC Angular Moderno © 2026</ds-footer>
        </mat-sidenav-content>

      </mat-sidenav-container>
    </div>

`,
  styles: [`
.shell {
display: flex;
flex-direction: column;
height: 100vh;
}
.sidenav-container {
flex: 1;
overflow: hidden;
}
.sidenav {
width: var(--sidenav-width);
padding-top: var(--spacing-sm);
}
.content {
display: flex;
flex-direction: column;
height: 100%;
}
.main {
flex: 1;
padding: var(--spacing-lg);
overflow-y: auto;
background: var(--color-background);
}
.domain-icon {
margin-right: var(--spacing-sm);
color: var(--color-primary);
}
.active-link {
background: var(--color-background);
color: var(--color-primary);
font-weight: 500;
}
`]
})
export class ShellLayoutComponent {
navigation = NAVIGATION;
sidenavOpen = signal(true);

toggleSidenav() {
this.sidenavOpen.update(v => !v);
}
}

// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
{
path: '',
loadComponent: () =>
import('./shell/layout/shell-layout.component')
.then(m => m.ShellLayoutComponent),
children: [
{
path: 'products/list',
loadComponent: () =>
import('./domains/products/feature-product-list/product-list-page.component')
.then(m => m.ProductListPageComponent),
},
{
path: 'orders/list',
loadComponent: () =>
import('./domains/orders/feature-order-list/order-list-page.component')
.then(m => m.OrderListPageComponent),
},
{
path: '',
redirectTo: 'products/list',
pathMatch: 'full'
}
]
}
];

// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
selector: 'app-root',
standalone: true,
imports: [RouterOutlet],
template: `<router-outlet></router-outlet>`
})
export class App {}
