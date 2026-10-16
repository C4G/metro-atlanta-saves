import { Route } from '@angular/router';
import { seoResolver } from '@mas/frontend-shared-util';

const TITLE_SUFFIX = '- Programs';

export const programProfilesRoutes: Route[] = [
  {
    path: ':id',
    loadChildren: () => [
      {
        path: '',
        loadComponent: () => import('./description/description.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Overview ${TITLE_SUFFIX}`,
            description: 'Program overview',
          },
        },
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
        path: 'course-progress',
        loadComponent: () => import('./course-progress/course-progress.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `My Tasks ${TITLE_SUFFIX}`,
            description: 'View and complete your program tasks',
          },
        },
      },
      {
        path: 'savings',
        loadComponent: () => import('./savings/savings.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `My Progress ${TITLE_SUFFIX}`,
            description: 'Record monthly savings and review your program progress',
          },
        },
      },
      {
        path: 'receipts',
        loadComponent: () => import('./receipts/receipts.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Receipts ${TITLE_SUFFIX}`,
            description: 'Upload and review your receipts',
          },
        },
      },
    ],
    loadComponent: () => import('./program-profile/program-profile.component'),
  },
];
