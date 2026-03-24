import { Routes } from '@angular/router';

export const featurePassagensRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./passagens').then((m) => m.Passagens),
  },
];
