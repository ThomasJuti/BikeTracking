import { Routes } from '@angular/router';
import { authGuard } from './modules/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./modules/motocicletas/motocicletas.routes').then(
        (m) => m.motocicletasRoutes,
      ),
  },
  { path: '**', redirectTo: 'inicio' },
];
