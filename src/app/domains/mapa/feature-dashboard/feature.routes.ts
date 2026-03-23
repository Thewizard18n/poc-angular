import { Routes } from "@angular/router";

export const featureDashboardRoutes:Routes = [ 
    {
        path: '',
        loadComponent: () => import('./feature-dashboard').then(m => m.FeatureDashboard)
    }
]