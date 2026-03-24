import { Routes } from '@angular/router';

export const financeiroRoutes: Routes = [
  {
    path: 'passagens',
    loadChildren: () => import('./features/passagens').then((m) => m.featurePassagensRoutes),
  },
];
