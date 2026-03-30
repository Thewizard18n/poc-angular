import { Routes } from '@angular/router';

export const featureDashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard').then((m) => m.FeatureDashboard),
  },
  {
    path: 'banana',
    loadComponent: () => import('./features/banana/banana').then((m) => m.Banana),
  },

  {
    path: 'maca',
    loadComponent: () => import('./features/maca').then((m) => m.Maca),
  },
];
