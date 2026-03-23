import { Routes } from "@angular/router";

export const featureARoutes:Routes = [ 
    {
        path: '',
        loadComponent: () => import('./feature/feature').then(m => m.Feature)
    }
]