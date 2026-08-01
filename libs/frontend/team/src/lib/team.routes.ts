import { Route } from '@angular/router';
import { seoResolver } from '@mas/frontend-shared-util';

const TITLE_SUFFIX = '| Building Resilient Professionals';

export const teamRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./team.component'),
    children: [
      {
        path: '',
        resolve: [seoResolver],
        loadComponent: () => import('./members/members.component'),
        data: {
          seo: {
            title: `C4G Team ${TITLE_SUFFIX}`,
            description:
              'The team with varying experience with web development working to bring savings education to families.',
          },
        },
      },
      {
        path: 'description',
        resolve: [seoResolver],
        loadComponent: () => import('./description/description.component'),
        data: {
          seo: {
            title: `Project Description ${TITLE_SUFFIX}`,
            description:
              'The project description for Building Resilient Professionals Computing For Good Spring 2024 team.',
          },
        },
      },
      {
        path: 'goal',
        resolve: [seoResolver],
        loadComponent: () => import('./goal/goal.component'),
        data: {
          seo: {
            title: `Project Goal ${TITLE_SUFFIX}`,
            description:
              'Our goal is to bring 1000 families into the Building Resilient Professionals program and save $1000.',
          },
        },
      },
      {
        path: 'lighthouse',
        resolve: [seoResolver],
        loadComponent: () => import('./lighthouse/lighthouse.component'),
        data: {
          seo: {
            title: `Lighthouse Report ${TITLE_SUFFIX}`,
            description: 'Our lighthouse scores represented as images for the home page of this site.',
          },
        },
      },
      {
        path: 'presentation',
        resolve: [seoResolver],
        loadComponent: () => import('./presentation/presentation.component'),
        data: {
          seo: {
            title: `Presentation Slides ${TITLE_SUFFIX}`,
            description: 'Powerpoint slides show casing goals, timeline, architecture and team members.',
          },
        },
      },
      {
        path: 'weekly-updates',
        resolve: [seoResolver],
        loadComponent: () => import('./weekly-updates/weekly-updates.component'),
        data: {
          seo: {
            title: `Weekly Updates ${TITLE_SUFFIX}`,
            description: 'Weekly Updates(notion board which has all tasks completed and being worked on)',
          },
        },
      },
      {
        path: 'project-survey-evaluations',
        resolve: [seoResolver],
        loadComponent: () => import('./project-peer-evaluations/project-peer-evaluations.component'),
        data: {
          seo: {
            title: `Project Peer Evaluations ${TITLE_SUFFIX}`,
            description: 'Project Peer Evaluations(typeform survey for Project Peer Evaluations)',
          },
        },
      },
      {
        path: 'demo',
        resolve: [seoResolver],
        loadComponent: () => import('./demo/demo.component'),
        data: {
          seo: {
            title: `Demo ${TITLE_SUFFIX}`,
            description: 'demo',
          },
        },
      },
    ],
  },
];
