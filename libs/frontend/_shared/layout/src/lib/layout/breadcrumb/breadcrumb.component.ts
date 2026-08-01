import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NavigationEnd, Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { filter, map, startWith } from 'rxjs';

type Breadcrumb = { label: string; url: string };

const BREADCRUMB_LABELS: Record<string, string> = {
  admin: 'Admin',
  users: 'Users',
  partners: 'Partners',
  blogs: 'Blogs',
  'about-us-management': 'About Us Management',
  'user-guide': 'User Guide',
  'checkpoint-names': 'Checkpoint Names',
  'peer-evaluation-guide': 'Peer Evaluation Guide',
  'email-blast': 'Email Campaign',
  'education-management': 'Education Management',
  'educational-content': 'Educational Content',
  'educational-categories': 'Educational Categories',
  'content-notifications': 'Content Notifications',
  'home-management': 'Home Management',
  stories: 'Stories',
  learnings: 'Learnings',
  description: 'Description',
  introduction: 'Introduction',
};

@Component({
  selector: 'mas-breadcrumb',
  imports: [RouterLink, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (breadcrumbs().length > 1) {
      <nav aria-label="breadcrumb" class="px-6 pt-4 pb-1 flex items-center gap-1 text-sm">
        @for (crumb of breadcrumbs(); track crumb.url; let first = $first; let last = $last) {
          @if (!first) {
            <mat-icon class="!text-base !w-4 !h-4 text-gray-400">chevron_right</mat-icon>
          }
          @if (last || first) {
            <span [class.font-semibold]="last" [class.text-gray-500]="first">{{ crumb.label }}</span>
          } @else {
            <a [routerLink]="crumb.url" class="hover:underline">{{ crumb.label }}</a>
          }
        }
      </nav>
    }
  `,
})
export class BreadcrumbComponent {
  private router = inject(Router);

  breadcrumbs = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.buildBreadcrumbs()),
    ),
    { initialValue: [] as Breadcrumb[] },
  );

  private buildBreadcrumbs(): Breadcrumb[] {
    const url = this.router.url.split('?')[0];
    if (!url.startsWith('/admin')) return [];

    const segments = url.split('/').filter(Boolean);
    const breadcrumbs: Breadcrumb[] = [];
    let accUrl = '';

    for (const segment of segments) {
      accUrl += `/${segment}`;
      const label = BREADCRUMB_LABELS[segment];
      if (label) {
        breadcrumbs.push({ label, url: accUrl });
      }
    }

    return breadcrumbs;
  }
}
