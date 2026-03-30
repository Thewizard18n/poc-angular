import { Routes } from '@angular/router';

export const comprasRoutes: Routes = [
  {
            path: 'consultar',
            loadComponent: () => import('./features/consultar').then((m) => m.Consultar)
        }
,
  {
            path: 'aprovar',
            loadComponent: () => import('./features/aprovar').then((m) => m.Aprovar)
        }
];
