import { Route } from '@angular/router';
import { seoResolver } from '@mas/frontend-shared-util';

const TITLE_SUFFIX = '- Programs | Building Resilient Professionals';

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
            title: `Description ${TITLE_SUFFIX}`,
            description: 'Description of the program',
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
            title: `Course Progress ${TITLE_SUFFIX}`,
            description: 'Track your program progress',
          },
        },
      },
      {
        path: 'savings',
        loadComponent: () => import('./savings/savings.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Savings ${TITLE_SUFFIX}`,
            description: 'Track your savings',
          },
        },
      },
      {
        path: 'receipts',
        loadComponent: () => import('./receipts/receipts.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Upload Receipts ${TITLE_SUFFIX}`,
            description: 'Upload your receipts',
          },
        },
      },
    ],
    loadComponent: () => import('./program-profile/program-profile.component'),
  },
];
