import { Routes } from '@angular/router';
import { guestGuard } from './guards/guest.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/register/register').then((m) => m.RegisterPageComponent),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
