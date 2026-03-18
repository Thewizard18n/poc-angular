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
  template: `    <mat-toolbar [style.background]="'var(--color-toolbar-bg)'"
             [style.color]="'var(--color-text-on-primary)'"
             [style.height]="'var(--toolbar-height)'">
  <button mat-icon-button (click)="menuClick.emit()">
    <mat-icon>menu</mat-icon>
  </button>
  <span class="title">{{ title() }}</span>
  <span class="spacer"></span>
  <ng-content></ng-content>
</mat-toolbar>`,
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
output,
ChangeDetectionStrategy
} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';

/\*\*

- Wrapper do mat-sidenav-container com tokens do design system.
- Encapsula container + sidenav + content.
- @example
- <ds-sidenav [opened]="open()">
- <ng-container sidenav>conteúdo do menu</ng-container>
- <ng-container content>conteúdo principal</ng-container>
- </ds-sidenav>
       */
      @Component({
        selector: 'ds-sidenav',
        standalone: true,
        imports: [MatSidenavModule],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <mat-sidenav-container class="container">
            <mat-sidenav
              [opened]="opened()"
              [mode]="mode()"
              class="sidenav">
              <ng-content select="[sidenav]"></ng-content>
            </mat-sidenav>

            <mat-sidenav-content class="content">
              <ng-content select="[content]"></ng-content>
            </mat-sidenav-content>
          </mat-sidenav-container>

  `,
styles: [`
  .container {
  height: 100%;
  }
  .sidenav {
  width: var(--sidenav-width);
  background: var(--color-sidenav-bg);
  border-right: 1px solid var(--color-border);
  padding-top: var(--spacing-sm);
  }
  .content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background);
  }
  `]
  })
  export class DsSidenavComponent {
  /** Controla se o sidenav está aberto \*/
  opened = input<boolean>(true);
  /** Modo do sidenav \*/
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
// src/app/shell/layout/shell-layout.component.ts
import {
Component,
signal,
ChangeDetectionStrategy
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { DsToolbarComponent, DsSidenavComponent, DsFooterComponent } from '../../shared/ui';
import { NAVIGATION } from '../navigation/navigation.config';

@Component({
selector: 'app-shell-layout',
standalone: true,
changeDetection: ChangeDetectionStrategy.OnPush,
imports: [
RouterOutlet,
RouterLink,
RouterLinkActive,
MatListModule,
MatIconModule,
MatButtonModule,
MatExpansionModule,
DsToolbarComponent,
DsSidenavComponent,
DsFooterComponent,
],
template: `

<div class="shell">

      <ds-toolbar
        title="POC Angular"
        (menuClick)="toggleSidenav()">
      </ds-toolbar>

      <ds-sidenav
        [opened]="sidenavOpen()"
        mode="side"
        class="sidenav-wrapper">

        <!-- conteúdo do menu -->
        <div sidenav>
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
        </div>

        <!-- conteúdo principal -->
        <div content class="main-content">
          <main class="main">
            <router-outlet></router-outlet>
          </main>
          <ds-footer>POC Angular Moderno © 2026</ds-footer>
        </div>

      </ds-sidenav>

    </div>

`,
  styles: [`
.shell {
display: flex;
flex-direction: column;
height: 100vh;
}
.sidenav-wrapper {
flex: 1;
overflow: hidden;
}
.main-content {
display: flex;
flex-direction: column;
height: 100%;
}
.main {
flex: 1;
padding: var(--spacing-lg);
overflow-y: auto;
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

// src/app/shell/layout/shell-layout.component.ts
import {
Component,
signal,
computed,
ChangeDetectionStrategy
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DsToolbarComponent, DsSidenavComponent, DsFooterComponent } from '../../shared/ui';
import { NAVIGATION, DomainNav } from '../navigation/navigation.config';

@Component({
selector: 'app-shell-layout',
standalone: true,
changeDetection: ChangeDetectionStrategy.OnPush,
imports: [
RouterOutlet,
RouterLink,
RouterLinkActive,
MatListModule,
MatIconModule,
MatButtonModule,
DsToolbarComponent,
DsSidenavComponent,
DsFooterComponent,
],
template: `

<div class="shell">

      <ds-toolbar title="POC Angular" (menuClick)="toggleSidenav()">
        <!-- domínios na toolbar -->
        @for (domain of navigation; track domain.id) {
          <button
            mat-button
            class="domain-btn"
            [class.active-domain]="activeDomain()?.id === domain.id"
            (click)="setDomain(domain)">
            <mat-icon>{{ domain.icon }}</mat-icon>
            {{ domain.label }}
          </button>
        }
      </ds-toolbar>

      <ds-sidenav [opened]="sidenavOpen()" mode="side" class="sidenav-wrapper">

        <!-- features do domínio ativo no sidenav -->
        <div sidenav>
          @if (activeDomain()) {
            <div class="sidenav-header">
              <mat-icon class="sidenav-icon">{{ activeDomain()!.icon }}</mat-icon>
              <span>{{ activeDomain()!.label }}</span>
            </div>
            <mat-nav-list>
              @for (feature of activeDomain()!.features; track feature.route) {
                <a mat-list-item
                   [routerLink]="feature.route"
                   routerLinkActive="active-link">
                  <mat-icon matListItemIcon>{{ feature.icon }}</mat-icon>
                  {{ feature.label }}
                </a>
              }
            </mat-nav-list>
          }
        </div>

        <!-- conteúdo principal -->
        <div content class="main-content">
          <main class="main">
            <router-outlet></router-outlet>
          </main>
          <ds-footer>POC Angular Moderno © 2026</ds-footer>
        </div>

      </ds-sidenav>

    </div>

`,
  styles: [`
.shell {
display: flex;
flex-direction: column;
height: 100vh;
}
.sidenav-wrapper {
flex: 1;
overflow: hidden;
}
.main-content {
display: flex;
flex-direction: column;
height: 100%;
}
.main {
flex: 1;
padding: var(--spacing-lg);
overflow-y: auto;
}
.domain-btn {
color: var(--color-text-on-primary);
margin: 0 var(--spacing-xs);
opacity: 0.8;
}
.domain-btn.active-domain {
opacity: 1;
border-bottom: 2px solid var(--color-text-on-primary);
}
.sidenav-header {
display: flex;
align-items: center;
gap: var(--spacing-sm);
padding: var(--spacing-md) var(--spacing-md);
font-weight: 500;
font-size: var(--font-size-lg);
color: var(--color-primary);
border-bottom: 1px solid var(--color-border);
margin-bottom: var(--spacing-sm);
}
.sidenav-icon {
color: var(--color-primary);
}
.active-link {
color: var(--color-primary);
font-weight: 500;
background: var(--color-background);
}
`]
})
export class ShellLayoutComponent {
navigation = NAVIGATION;
sidenavOpen = signal(true);
activeDomain = signal<DomainNav>(NAVIGATION[0]);

setDomain(domain: DomainNav) {
this.activeDomain.set(domain);
}

toggleSidenav() {
this.sidenavOpen.update(v => !v);
}
}

Você é um desenvolvedor Angular 20 especialista. Preciso que você implemente a seguinte estrutura em um projeto Angular 20 com Angular Material já configurado.

## Contexto

- Projeto Angular 20 standalone
- Angular Material já instalado
- Estrutura de arquivos já existe em src/app/products/ e src/app/orders/
- Seguimos arquitetura em camadas: data-access, ui-_, feature-_
- Componentes usam ChangeDetectionStrategy.OnPush obrigatoriamente
- Usamos Signals e toSignal do @angular/core/rxjs-interop
- Sem NgModules — tudo standalone

## O que preciso que você crie

### 1. src/app/products/data-access/product.model.ts

Interface ProductModel com campos:

- id: string
- nome: string
- preco: number
- categoria: string
- estoque: number

### 2. src/app/products/data-access/product.dto.ts

Interface ProductResponseDTO com campos:

- id: string
- name: string
- price: number
- category: string
- stock: number

### 3. src/app/products/data-access/product.mapper.ts

Função pura mapProductFromDTO(dto: ProductResponseDTO): ProductModel
Mapeia: name→nome, price→preco, category→categoria, stock→estoque

### 4. src/app/products/data-access/product.repository.ts

Abstract class ProductRepository com métodos abstratos:

- getAll(): Observable<ProductModel[]>
- getById(id: string): Observable<ProductModel>
  Decorator @Injectable()

### 5. src/app/products/data-access/product.repository.mock.ts

Class ProductRepositoryMock extends ProductRepository
Mock com 4 produtos: Notebook Pro, Mouse Wireless, Teclado Mecânico, Monitor 4K
Usa of() com delay(800) para simular HTTP

### 6. src/app/products/data-access/index.ts

Exporta tudo do data-access

### 7. src/app/products/ui-product-card/product-card.component.ts

Dumb component com selector ui-product-card

- input.required<ProductModel>() chamado product
- output<ProductModel>() chamado selected emitido no clique de um botão "Ver detalhe"
- Usa MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, CurrencyPipe
- Mostra: nome, categoria como chip, preco em BRL, estoque com ícone
- Estoque abaixo de 10 fica vermelho com classe low-stock
- OnPush obrigatório
- JSDoc na classe e nos inputs/outputs

### 8. src/app/products/ui-product-card/index.ts

Exporta ProductCardComponent

### 9. src/app/products/feature-product-list/product-list.usecase.ts

Class ProductListUseCase com @Injectable()

- inject(ProductRepository)
- método execute() retorna this.repository.getAll()
- JSDoc na classe e no método

### 10. src/app/products/feature-product-list/product-list-page.component.ts

Smart component com selector app-product-list-page

- OnPush obrigatório
- providers: [ProductListUseCase, { provide: ProductRepository, useClass: ProductRepositoryMock }]
- inject(ProductListUseCase) e inject(Router)
- products = toSignal(this.useCase.execute(), { initialValue: [] })
- total = computed(() => this.products().length)
- loading = computed(() => this.products().length === 0)
- onSelect(product) navega para /products/detail/:id
- Template: título "Produtos", loading state, total de produtos, grid de ui-product-card
- Grid com grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))
- JSDoc na classe

### 11. src/app/products/feature-product-list/index.ts

Exporta ProductListPageComponent

### 12. src/app/app.routes.ts

Routes com:

- path '' carrega ShellLayoutComponent lazy de ./shell/layout/shell-layout.component
- children:
  - path 'products/list' carrega ProductListPageComponent lazy
  - path '' redirectTo 'products/list' pathMatch 'full'

## Regras obrigatórias

- Todos os componentes são standalone: true
- ChangeDetectionStrategy.OnPush em todos os componentes
- Sem NgModules
- Imports explícitos em cada componente
- Usar CSS custom properties para estilo: var(--color-primary), var(--spacing-md), etc
- JSDoc em todas as classes, inputs e outputs
- Usar signals: input(), output(), signal(), computed()
- Usar toSignal() para converter Observable em Signal no smart component
- Abstract class para repository, nunca interface
- Mock com delay para simular HTTP

## Formato de resposta

Para cada arquivo me retorne exatamente neste formato:

### [caminho/do/arquivo.ts]

```typescript
[código completo]
```

Sem explicações adicionais. Só o código de cada arquivo.
