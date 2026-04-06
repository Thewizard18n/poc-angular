import { Routes } from '@angular/router';
import { Sidenav } from './shell/ui/sidenav/sidenav';

export const routes: Routes = [
  {
    path: '',
    component: Sidenav,
    children: [
      { path: '', redirectTo: 'mapa', pathMatch: 'full' },
      {
        path: 'mapa',
        loadChildren: () => import('./domains/mapa/mapa.routes').then((m) => m.featureDashboardRoutes),
      },
      {
        path: 'relatorios',
        loadChildren: () => import('./domains/relatorios/relatorios.routes').then((m) => m.relatoriosRoutes),
      },
      {
        path: 'financeiro',
        loadChildren: () => import('./domains/financeiro/financeiro.routes').then((m) => m.financeiroRoutes),
      },
      {
        path: 'compras',
        loadChildren: () => import('./domains/compras/compras.routes').then((m) => m.comprasRoutes),
      },
      {
        path: 'estoque',
        loadChildren: () => import('./domains/estoque/estoque.routes').then((m) => m.estoqueRoutes),
      },
   
    ],
  },
];
