import { Routes } from '@angular/router';

export const financeiroRoutes: Routes = [
  {
    path: 'passagens',
    loadChildren: () => import('./features/passagens').then((m) => m.featurePassagensRoutes),
  },

  {
            path: 'veiculos',
            loadComponent: () => import('./features/veiculos').then((m) => m.Veiculos)
        }
,
  {
            path: 'resumo',
            loadComponent: () => import('./features/resumo').then((m) => m.Resumo)
        }
,
  {
            path: 'teste',
            loadComponent: () => import('./features/teste').then((m) => m.Teste)
        }
];
