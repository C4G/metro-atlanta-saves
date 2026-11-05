import { Route } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '@mas/frontend-shared-auth';
import { seoResolver } from '@mas/frontend-shared-util';

const TITLE_SUFFIX = '- Programs';

export const programProfilesRoutes: Route[] = [
  {
    path: ':id',
    loadChildren: () => [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: () => (inject(AuthStore).isStaff() ? 'particpants' : 'progress'),
      },
      {
        path: 'particpants',
        loadComponent: () => import('./participants/participants.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Participants ${TITLE_SUFFIX}`,
            description: 'Participants in the program',
          },
        },
      },
      {
        path: 'progress',
        loadComponent: () => import('./progress/progress.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `My Progress ${TITLE_SUFFIX}`,
            description: 'Track your tasks, savings and receipts month by month',
          },
        },
      },
      {
        path: 'insights',
        loadComponent: () => import('./insights/insights.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `My Insights ${TITLE_SUFFIX}`,
            description: 'See your progress, savings and credit score change at a glance',
          },
        },
      },
      { path: 'course-progress', pathMatch: 'full', redirectTo: 'progress' },
      { path: 'savings', pathMatch: 'full', redirectTo: 'progress' },
      { path: 'receipts', pathMatch: 'full', redirectTo: 'progress' },
    ],
    loadComponent: () => import('./program-profile/program-profile.component'),
  },
];
