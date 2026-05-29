import { Routes } from '@angular/router';
import { MainShellComponent } from './layout/main-shell';

export const motocicletasRoutes: Routes = [
  {
    path: '',
    component: MainShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () =>
          import('./pages/home-dashboard/home-dashboard').then(
            (m) => m.HomeDashboardPageComponent,
          ),
      },
      {
        path: 'mi-moto',
        loadComponent: () =>
          import('./pages/mi-moto/mi-moto').then((m) => m.MiMotoPageComponent),
      },
      {
        path: 'mantenimiento',
        loadComponent: () =>
          import('./pages/mantenimiento/mantenimiento').then(
            (m) => m.MantenimientoPageComponent,
          ),
      },
      {
        path: 'comparador',
        loadComponent: () =>
          import('./pages/comparador/comparador').then(
            (m) => m.ComparadorPageComponent,
          ),
      },
    ],
  },
];
