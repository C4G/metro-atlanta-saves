import { Route } from '@angular/router';
import { seoResolver } from '@mas/frontend-shared-util';

const TITLE_SUFFIX = '| Building Resilient Professionals';

export const peerEvaluationGuideRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./peer-evaluation-guide/peer-evaluation-guide.component'),
    resolve: [seoResolver],
    data: {
      seo: {
        title: `Peer Evaluation Guide ${TITLE_SUFFIX}`,
        description: 'Instructions on how to access and complete the Peer Evaluation Survey.',
      },
    },
  },
];
