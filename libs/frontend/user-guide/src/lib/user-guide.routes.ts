import { Route } from '@angular/router';
import { seoResolver } from '@mas/frontend-shared-util';

const TITLE_SUFFIX = '| Building Resilient Professionals';

export const userGuideRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./user-guide/user-guide.component'),
    resolve: [seoResolver],
    data: {
      seo: {
        title: `User Guide ${TITLE_SUFFIX}`,
        description: 'This is a guide built to help you navigate the Building Resilient Professionals site.',
      },
    },
  },
];
