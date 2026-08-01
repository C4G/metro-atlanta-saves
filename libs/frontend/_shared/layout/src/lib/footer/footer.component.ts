import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mas-footer',
  imports: [MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="flex flex-col sm:flex-row text-center justify-center p-4 gap-4">
      <p>
        &copy;
        {{ currentYear() }} Building Resilient Professionals
      </p>

      <a mat-icon-anchor class="flex justify-center align-center gap-2 ml-0 sm:ml-auto" routerLink="/team">
        <mat-icon>groups</mat-icon>
        <span>C4G Team</span>
      </a>
    </footer>
  `,
  host: {
    class: 'block',
  },
})
export class FooterComponent {
  currentYear = signal(new Date().getFullYear());
}
