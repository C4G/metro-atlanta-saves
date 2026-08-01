import { Route } from '@angular/router';
import { adminGuard, authGuard, partnerStaffGuard } from '@mas/frontend-shared-auth';
import { seoResolver } from '@mas/frontend-shared-util';

const TITLE_SUFFIX = '| Building Resilient Professionals';

export const appRoutes: Route[] = [
  {
    path: '',
    resolve: [seoResolver],
    loadComponent: () => import('@mas/frontend-home').then((m) => m.HomeComponent),
    data: {
      seo: {
        title: `Helping You Save Money ${TITLE_SUFFIX}`,
        description:
          'We are here to help you save money! Did you know that having an emergency savings fund increases happiness and decreases stress?',
      },
    },
  },
  {
    path: 'about-us',
    resolve: [seoResolver],
    loadComponent: () => import('@mas/frontend-about-us').then((m) => m.AboutUsComponent),
    data: {
      seo: {
        title: `About Us ${TITLE_SUFFIX}`,
        description:
          'Our goal and promise it to help those that need it with saving money for your family and future. We are driven and passionate about homelessness and helping those in need.',
      },
    },
  },
  {
    path: 'savings-calculator',
    resolve: [seoResolver],
    loadComponent: () => import('@mas/frontend-savings-calculator').then((m) => m.SavingsCalculatorComponent),
    data: {
      seo: {
        title: `Savings Interest Calculator ${TITLE_SUFFIX}`,
        description:
          'Monthly contributions and compounding interest can lead to more money in your pocket for your family. Get started today with our monthly interest calculator and see what you can save!',
      },
    },
  },
  {
    path: 'blogs',
    loadChildren: () => import('@mas/frontend-blogs').then((m) => m.blogRoutes),
  },
  {
    path: 'educational-resources',
    resolve: [seoResolver],
    loadComponent: () => import('@mas/frontend-educational-resources').then((m) => m.EducationalResourcesComponent),
    data: {
      seo: {
        title: `Educational Resources ${TITLE_SUFFIX}`,
        description: 'Educational Resources selected by our team to help you save',
      },
    },
  },
  {
    path: 'discussion-boards',
    canActivate: [authGuard],
    resolve: [seoResolver],
    loadComponent: () =>
      import('./discussion-boards-dashboard.component').then((m) => m.DiscussionBoardsDashboardComponent),
    data: {
      seo: {
        title: `Discussion Boards ${TITLE_SUFFIX}`,
        description: 'Browse and access discussion boards for your programs and cohorts.',
      },
    },
  },
  {
    path: 'discussion/:id',
    canActivate: [authGuard],
    resolve: [seoResolver],
    loadComponent: () => import('./discussion-board-forum.component').then((m) => m.DiscussionBoardForumComponent),
    data: {
      seo: {
        title: `Discussion Board ${TITLE_SUFFIX}`,
        description: 'Participate in board-specific discussions.',
      },
    },
  },
  {
    path: 'team',
    loadChildren: () => import('@mas/frontend-team').then((m) => m.teamRoutes),
  },
  {
    path: 'admin',
    canActivateChild: [adminGuard],
    loadChildren: () => import('@mas/frontend-admin').then((m) => m.adminRoutes),
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'partner-staff',
    canActivateChild: [partnerStaffGuard],
    loadChildren: () => import('@mas/frontend-partner-staff').then((m) => m.partnerStaffRoutes),
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'program-profiles',
    canActivateChild: [authGuard],
    loadChildren: () => import('@mas/frontend-program-profiles').then((m) => m.programProfilesRoutes),
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'user-guide',
    loadChildren: () => import('@mas/frontend-user-guide').then((m) => m.userGuideRoutes),
  },
  {
    path: 'peer-evaluation-guide',
    loadChildren: () => import('@mas/frontend-peer-evaluation-guide').then((m) => m.peerEvaluationGuideRoutes),
  },
  {
    path: 'login',
    resolve: [seoResolver],
    loadComponent: () => import('@mas/frontend-login').then((m) => m.LoginComponent),
    data: {
      seo: {
        title: `Log In ${TITLE_SUFFIX}`,
        description: 'Log in to Building Resilient Professionals! ',
      },
    },
  },
  {
    path: 'forgot-password',
    resolve: [seoResolver],
    loadComponent: () => import('@mas/frontend-forgot-password').then((m) => m.ForgotPasswordComponent),
    data: {
      seo: {
        title: `Forgot Password ${TITLE_SUFFIX}`,
        description: 'It looks like you forgot your password. Fill in the form to receive an email to reset it.',
      },
    },
  },
  {
    path: 'reset-password',
    resolve: [seoResolver],
    loadComponent: () => import('@mas/frontend-reset-password').then((m) => m.ResetPasswordComponent),
    data: {
      seo: {
        title: `Reset Password ${TITLE_SUFFIX}`,
        description: 'Resetting your password is easy as submitting your new password!',
      },
    },
  },
  {
    path: 'register',
    resolve: [seoResolver],
    loadComponent: () => import('@mas/frontend-register').then((m) => m.RegisterComponent),
    data: {
      seo: {
        title: `Register ${TITLE_SUFFIX}`,
        description: 'The registration page to sign up for Building Resilient Professionals! ',
      },
    },
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    resolve: [seoResolver],
    loadComponent: () => import('@mas/frontend-dashboard').then((m) => m.DashboardComponent),
    data: {
      seo: {
        title: `Dashboard ${TITLE_SUFFIX}`,
        description: 'The dashboard for registering for upcoming programs within BRP.',
      },
    },
  },
  {
    path: 'enroll/:id',
    canActivate: [authGuard],
    resolve: [seoResolver],
    loadComponent: () => import('@mas/frontend-enroll').then((m) => m.EnrollComponent),
    data: {
      seo: {
        title: `Enroll in Program ${TITLE_SUFFIX}`,
        description: 'Enrollment form to apply for a program within BRP.',
      },
    },
  },
  {
    path: '**',
    redirectTo: '',
  },
];
