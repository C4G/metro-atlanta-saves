import { Route } from '@angular/router';
import { seoResolver } from '@mas/frontend-shared-util';

const TITLE_SUFFIX = 'Blogs | Building Resilient Professionals';

export const blogRoutes: Route[] = [
  {
    path: '',
    resolve: [seoResolver],
    loadComponent: () => import('./blogs.component'),
    data: {
      seo: {
        title: `${TITLE_SUFFIX}`,
        description: 'Explore our blog posts helping you navigate the path to saving money.',
      },
    },
  },
  {
    path: ':slug',
    resolve: [seoResolver],
    loadComponent: () => import('./blog/blog.component'),
    data: {
      seo: {
        title: `Blog - ${TITLE_SUFFIX}`,
        description: 'This is a specific blog page which will give you educational info to help you on your path.',
      },
    },
  },
];
