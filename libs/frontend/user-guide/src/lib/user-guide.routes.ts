import { Route } from '@angular/router';
import { seoResolver } from '@mas/frontend-shared-util';

export const userGuideRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./user-guide/user-guide.component'),
    resolve: [seoResolver],
    data: {
      seo: {
        title: 'User Guide',
        description: 'This is a guide built to help you navigate the Building Resilient Professionals site.',
      },
    },
  },
];
