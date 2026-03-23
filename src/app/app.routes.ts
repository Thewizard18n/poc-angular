import { Routes } from '@angular/router';
import { Sidenav } from './shell/ui/sidenav/sidenav';

export const routes: Routes = [
  {
    path: '',
    component: Sidenav,   // layout com as sidebars
    children: [

      { path: '', redirectTo: 'mapa ', pathMatch: 'full' },

      {
        path: 'mapa',
        loadChildren: () => import('./domains/mapa/feature-dashboard/feature.routes').then(m => m.featureDashboardRoutes),
      },
      {
        path: 'relatorios',
        loadChildren: () => import('./domains/relatorios/features/feature.routes').then(m => m.relatoriosRoutes),
      },
    ],
  },
];
