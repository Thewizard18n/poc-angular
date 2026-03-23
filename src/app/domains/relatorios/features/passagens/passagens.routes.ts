import { Routes } from "@angular/router";

export const featurePassagensRoutes:Routes = [ 
    {
        path: '',
        loadComponent: () => import('./passagens').then(m => m.Passagens)
    },
    {
        path: 'edit',
        loadComponent: () => import('./edit/edit').then(m => m.Edit)
    }
]