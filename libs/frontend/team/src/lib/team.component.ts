import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { NavigationEnd, Router, RouterLink, RouterOutlet, RoutesRecognized } from '@angular/router';
import { Nav } from '@mas/models';
import { filter, map } from 'rxjs';

@Component({
  selector: 'mas-team',
  imports: [MatTabNav, MatTabLink, RouterLink, RouterOutlet, MatTabNavPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav mat-tab-nav-bar [tabPanel]="tabPanel">
      @for (link of links(); track link.routerLink) {
        <a mat-tab-link [routerLink]="link.routerLink" [active]="activeLink() === link.routerLink">
          {{ link.name }}
        </a>
      }
    </nav>
    <mat-tab-nav-panel #tabPanel />
    <router-outlet />
  `,
  host: {
    class: 'block',
  },
})
export default class TeamComponent {
  private router = inject(Router);

  links = signal<Nav[]>([
    { routerLink: '/team', name: 'Team' },
    { routerLink: '/team/description', name: 'Project Description' },
    { routerLink: '/team/goal', name: 'Project Goal' },
    { routerLink: '/team/lighthouse', name: 'Lighthouse Report' },
    { routerLink: '/team/presentation', name: 'Presentation Slides' },
    { routerLink: '/team/weekly-updates', name: 'Weekly Updates' },
    { routerLink: '/team/project-survey-evaluations', name: 'Project Peer Evaluations' },
    { routerLink: '/team/demo', name: 'Demo' },
  ]);
  activeLink = toSignal(
    this.router.events.pipe(
      filter((event): event is RoutesRecognized => event instanceof NavigationEnd),
      map((event) => event.url),
    ),
  );
}
