import { Route } from '@angular/router';
import { seoResolver } from '@mas/frontend-shared-util';

export const programRoutes: Route[] = [
  {
    path: 'users/:userId',
    loadComponent: () => import('./user-checkpoints/user-checkpoints.component'),
    resolve: [seoResolver],
    data: { seo: { title: 'Participant checkpoints - Program', description: 'Manage participant checkpoints' } },
  },
  {
    path: '',
    loadComponent: () => import('./program.component'),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'manage' },
      ...['edit', 'users', 'allies', 'enrollments', 'documents', 'document-management'].map(
        (path): Route => ({ path, pathMatch: 'full', redirectTo: 'manage' }),
      ),
      { path: 'cohort-percentage-completion', pathMatch: 'full', redirectTo: 'insights' },
      { path: 'task-review', pathMatch: 'full', redirectTo: 'progress' },
      { path: 'requirements', pathMatch: 'full', redirectTo: 'tasks' },
      {
        path: 'progress',
        loadComponent: () => import('./monthly-progress/monthly-progress.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: 'Tasks review - Program',
            description: 'Review participant tasks and documents one month at a time, or across every month',
          },
        },
      },
      {
        path: 'insights',
        loadComponent: () => import('./insights/program-insights.component'),
        resolve: [seoResolver],
        data: { seo: { title: 'Insights - Program', description: 'See how the program is doing across every month' } },
      },
      {
        path: 'manage',
        loadComponent: () => import('./manage/manage-program.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: 'Manage program',
            description: 'Manage people, the monthly plan, settings, requests and documents',
          },
        },
      },
      {
        path: 'tasks',
        loadComponent: () => import('./tasks/program-tasks.component'),
        resolve: [seoResolver],
        data: { seo: { title: 'Tasks - Program', description: 'Edit task types, reminders and instructions' } },
      },
    ],
  },
];
