import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./components/accounts/accounts').then((module) => module.Accounts) },
  { path: 'accounts', loadComponent: () => import('./components/accounts/accounts').then((module) => module.Accounts) },
  {
    path: 'accounts/:id',
    loadComponent: () => import('./components/account-details/account-details').then((module) => module.AccountDetails),
  },
];
