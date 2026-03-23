import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

export interface SubNavItem {
  label: string;
  description: string;
  icon: string;
  route: string;
}
@Component({
  selector: 'app-ui-container',
  imports: [RouterLink, RouterLinkActive, MatIconModule, RouterOutlet],
  template: `
  <!-- sub-sidenav.component.html -->
<div class="sub-shell">

  <!-- Sub-sidebar -->
  <aside class="sub-shell__sidebar">

    <div class="sub-shell__header">
      <span class="material-icons-round">bar_chart</span>
      <span class="sub-shell__title">Relatórios</span>
    </div>

    <nav class="sub-shell__nav">
      @for (item of items; track item.route) {
        <a class="sub-nav-item"
           [routerLink]="item.route"
           routerLinkActive="active"
           [routerLinkActiveOptions]="{ exact: item.route === './' }">
          <div class="sub-nav-item__icon">
            <mat-icon>{{ item.icon }}</mat-icon>
          </div>
          <span class="sub-nav-item__label">{{ item.label }}</span>
        </a>
      }
    </nav>

  </aside>

  <!-- Conteúdo da rota filha -->
  <main class="sub-shell__content">
    <router-outlet />
  </main>

</div>
  `,
  styleUrl: './ui-container.scss',
})
export class UiContainer {
    readonly items = [
    { label: 'Veículos',  icon: 'directions_car', route: './'          },
    { label: 'Passagens', icon: 'receipt_long',    route: './passagens' },
  ];
}

