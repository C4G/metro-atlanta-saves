import { Route } from '@angular/router';
import { seoResolver } from '@mas/frontend-shared-util';

const TITLE_SUFFIX = '- Partners | Building Resilient Professionals';

export const partnerStaffRoutes: Route[] = [
  {
    path: 'programs',
    children: [
      {
        path: '',
        loadComponent: () => import('./programs/programs.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Programs ${TITLE_SUFFIX}`,
            description: 'Manage programs for partners',
          },
        },
      },
      {
        path: ':id',
        loadChildren: () => import('./program/program.routes').then((m) => m.programRoutes),
      },
    ],
  },
];
