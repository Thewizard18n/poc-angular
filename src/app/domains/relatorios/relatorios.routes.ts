import { Routes } from '@angular/router';

export const relatoriosRoutes: Routes = [

      {
        path: '',
        loadComponent: () => import('./features/veiculos/veiculos').then((m) => m.Veiculos),
      },
      {
        path: 'passagens',
        loadChildren: () =>
          import('./features/passagens/passagens.routes').then((m) => m.featurePassagensRoutes),
      },
      {
        path: 'teste',
        loadComponent: () => import('./features/teste/teste').then((m) => m.Teste),
      },
];
