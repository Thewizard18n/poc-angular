import { Routes } from "@angular/router";
import { UiContainer } from "../ui-container/ui-container";

export const relatoriosRoutes:Routes = [
    {
        path: '',
        component: UiContainer,
        children: [
            {
                path: '',
                loadComponent: () => import('./veiculos/veiculos').then(m => m.Veiculos)
            },
            {
                path: 'passagens',
                loadChildren: () => import('./passagens/passagens.routes').then(m => m.featurePassagensRoutes)
            }
        ]
    },

]