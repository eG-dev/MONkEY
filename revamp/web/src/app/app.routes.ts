import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./accounts').then((module) => module.Accounts) },
  { path: 'accounts', loadComponent: () => import('./accounts').then((module) => module.Accounts) },
  {
    path: 'accounts/:id',
    loadComponent: () => import('./account-details').then((module) => module.AccountDetails),
  },
];
