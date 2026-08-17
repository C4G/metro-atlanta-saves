import { Route } from '@angular/router';
import { seoResolver } from '@mas/frontend-shared-util';

const TITLE_SUFFIX = '- Program';

export const programRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./program.component'),
    children: [
      {
        path: '',
        loadComponent: () => import('./requirements/requirements.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Requirements ${TITLE_SUFFIX}`,
            description: 'Manage requirements for a program for users to accomplish',
          },
        },
      },
      {
        path: 'enrollments',
        loadComponent: () => import('./enrollments/enrollments.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Enrollments ${TITLE_SUFFIX}`,
            description: 'Accept users into this program',
          },
        },
      },
      {
        path: 'users',
        loadComponent: () => import('./users-on-programs/users-on-programs.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Users ${TITLE_SUFFIX}`,
            description: 'Manage the users associated with this program',
          },
        },
      },
      {
        path: 'allies',
        loadComponent: () => import('./allies-on-programs/allies-on-programs.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Allies ${TITLE_SUFFIX}`,
            description: 'Manage allies associated with this program',
          },
        },
      },
      {
        path: 'document-management',
        loadComponent: () => import('./document-managemant/document-management.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Document Management ${TITLE_SUFFIX}`,
            description: 'Manage user documents associated with this program',
          },
        },
      },
      {
        path: 'cohort-percentage-completion',
        loadComponent: () => import('./cohort-percentage-completion/cohort-percentage-completion.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Cohort Percentage Completion ${TITLE_SUFFIX}`,
            description:
              'Display cohort percentage completion for the entire cohort as well as amount broken down per individual',
          },
        },
      },
    ],
  },
  {
    path: 'users/:userId',
    loadComponent: () => import('./user-checkpoints/user-checkpoints.component'),
    resolve: [seoResolver],
    data: {
      seo: {
        title: `User Checkpoints ${TITLE_SUFFIX}`,
        description: 'Manage the users checkpoints associated with this program',
      },
    },
  },
];
