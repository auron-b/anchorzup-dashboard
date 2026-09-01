import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    // Standalone lazy-loading: the dashboard feature (gridster, echarts,
    // faker-backed data, all its widgets) only downloads once the user
    // actually navigates here, instead of bloating the initial bundle.
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  { path: '**', redirectTo: '' },
];
