import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./components/overview/overview').then((module) => module.Overview) },
  { path: 'accounts', loadComponent: () => import('./components/accounts/accounts').then((module) => module.Accounts) },
  {
    path: 'accounts/:id',
    loadComponent: () => import('./components/account-details/account-details').then((module) => module.AccountDetails),
  },
  {
    path: 'administration',
    loadComponent: () => import('./components/administration/administration').then((module) => module.Administration),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./components/profile/profile').then((module) => module.Profile) },
      { path: 'users', loadComponent: () => import('./components/users/users').then((module) => module.Users) },
    ],
  },
];
