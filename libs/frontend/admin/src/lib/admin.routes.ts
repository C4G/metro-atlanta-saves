import { Route } from '@angular/router';
import { seoResolver } from '@mas/frontend-shared-util';

const TITLE_SUFFIX = '- Admin';

export const adminRoutes: Route[] = [
  {
    path: '',
    children: [
      {
        path: 'users',
        loadComponent: () => import('./users/users.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Users ${TITLE_SUFFIX}`,
            description: 'Manage users and roles directly inline in this table.',
          },
        },
      },
      {
        path: 'partners',
        loadComponent: () => import('./partners/partners.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Partners ${TITLE_SUFFIX}`,
            description: 'Manage your partners directly inline in this table.',
          },
        },
      },
      {
        path: 'blogs',
        loadComponent: () => import('./blogs/admin-blogs.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Blogs ${TITLE_SUFFIX}`,
            description: 'Manage your blogs to empower your users to learn all you have to offer.',
          },
        },
      },
      {
        path: 'about-us-management',
        loadComponent: () => import('./about-us-management/about-us-management.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `About Us Management ${TITLE_SUFFIX}`,
            description: 'Manage cohorts on the about-us page',
          },
        },
      },
      {
        path: 'user-guide',
        loadComponent: () => import('./user-guide/user-guide.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `User Guide ${TITLE_SUFFIX}`,
            description: 'Manage the user guide section for users',
          },
        },
      },
      {
        path: 'checkpoint-names',
        loadComponent: () => import('./checkpoint-names/checkpoint-names.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Checkpoint Names ${TITLE_SUFFIX}`,
            description: 'Manage the checkpoint names for users',
          },
        },
      },
      {
        path: 'peer-evaluation-guide',
        loadComponent: () => import('./peer-evaluation-guide/peer-evaluation-guide.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Peer Evaluation Guide ${TITLE_SUFFIX}`,
            description: 'Manage the peer evaluation guide for users',
          },
        },
      },
      {
        path: 'email-blast',
        loadComponent: () => import('./email-blast/email-blast.component'),
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Email Campaign ${TITLE_SUFFIX}`,
            description: 'Send a monthly email to all users',
          },
        },
      },
      {
        path: 'education-management',
        redirectTo: 'education-management/educational-content',
      },
      {
        path: 'education-management',
        loadComponent: () => import('./education-management/education-management.component'),
        children: [
          {
            path: 'educational-content',
            loadComponent: () => import('./education-management/educational-content/educational-content.component'),
            resolve: [seoResolver],
            data: {
              seo: {
                title: `Education Content ${TITLE_SUFFIX}`,
                description: 'Manage educational content',
              },
            },
          },
          {
            path: 'educational-categories',
            loadComponent: () =>
              import('./education-management/educational-categories/educational-categories.component'),
            resolve: [seoResolver],
            data: {
              seo: {
                title: `Educational Categories ${TITLE_SUFFIX}`,
                description: 'Manage educational categories',
              },
            },
          },
          {
            path: 'content-notifications',
            loadComponent: () => import('./education-management/content-notifications/content-notifications.component'),
            resolve: [seoResolver],
            data: {
              seo: {
                title: `Content Notifications ${TITLE_SUFFIX}`,
                description: 'Send educational content notification emails to program participants',
              },
            },
          },
        ],
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Education Management ${TITLE_SUFFIX}`,
            description: 'Manage education categories and content',
          },
        },
      },
      {
        path: 'home-management',
        redirectTo: 'home-management/introduction',
      },
      {
        path: 'home-management',
        loadComponent: () => import('./home-management/home-management.component'),
        children: [
          {
            path: 'stories',
            loadComponent: () => import('./home-management/stories/stories.component'),
            resolve: [seoResolver],
            data: {
              seo: {
                title: `Community Stories ${TITLE_SUFFIX}`,
                description: 'Manage participant stories on the landing page',
              },
            },
          },
          {
            path: 'learnings',
            loadComponent: () => import('./home-management/learnings/learnings.component'),
            resolve: [seoResolver],
            data: {
              seo: {
                title: `Program Highlights ${TITLE_SUFFIX}`,
                description: 'Manage the practical path forward cards on the landing page',
              },
            },
          },
          {
            path: 'description',
            loadComponent: () => import('./home-management/description/description.component'),
            resolve: [seoResolver],
            data: {
              seo: {
                title: `Programs Overview ${TITLE_SUFFIX}`,
                description: 'Manage the programs introduction on the landing page',
              },
            },
          },
          {
            path: 'introduction',
            loadComponent: () => import('./home-management/intorduction/introduction.component'),
            resolve: [seoResolver],
            data: {
              seo: {
                title: `Hero ${TITLE_SUFFIX}`,
                description: 'Manage the landing page hero section',
              },
            },
          },
          {
            path: 'financial-facts',
            loadComponent: () => import('./home-management/financial-facts/financial-facts.component'),
            resolve: [seoResolver],
            data: {
              seo: {
                title: `Financial Facts ${TITLE_SUFFIX}`,
                description: 'Manage the financial facts on the landing page',
              },
            },
          },
          {
            path: 'what-we-are',
            loadComponent: () => import('./home-management/what-we-are/what-we-are.component'),
            resolve: [seoResolver],
            data: {
              seo: {
                title: `Who We Are ${TITLE_SUFFIX}`,
                description: 'Manage the organization and program purpose content on the landing page',
              },
            },
          },
        ],
        resolve: [seoResolver],
        data: {
          seo: {
            title: `Landing Page ${TITLE_SUFFIX}`,
            description: 'Manage each section of the public landing page',
          },
        },
      },
    ],
  },
];
