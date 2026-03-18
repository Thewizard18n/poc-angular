import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dominio-a/feature-a/index').then((m) => m.Feature),
  },
];
