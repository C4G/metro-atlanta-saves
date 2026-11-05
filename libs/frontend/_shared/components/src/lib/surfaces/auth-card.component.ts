import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'mas-auth-card',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex justify-center px-3 pb-10 pt-5 sm:px-6 sm:pt-10">
      <section
        class="w-full overflow-hidden rounded-2xl border border-outline/65 bg-surface/90 text-ink shadow-xl backdrop-blur-lg backdrop-saturate-150"
        [class]="wide() ? 'max-w-xl' : 'max-w-md'"
        [attr.aria-labelledby]="headingId()"
      >
        @if (heading()) {
          <div class="flex items-start gap-3.5 border-b border-outline/55 px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft/80 text-brand-strong"
              aria-hidden="true"
            >
              <mat-icon class="mas-icon-md">{{ icon() }}</mat-icon>
            </span>
            <div class="min-w-0">
              <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink" [id]="headingId()">
                {{ heading() }}
              </h1>
              @if (subtitle()) {
                <p class="mt-1 text-sm leading-5 text-ink-muted">{{ subtitle() }}</p>
              }
            </div>
          </div>
        }
        <ng-content />
        <div
          class="flex flex-wrap justify-center gap-1.5 border-t border-outline/55 bg-surface-subtle/35 px-4 py-3.5 text-sm text-ink-muted sm:px-6"
        >
          <ng-content select="[authFooter]" />
        </div>
      </section>
    </div>
  `,
  host: { class: 'block' },
})
export class AuthCardComponent {
  readonly headingId = input.required<string>();
  readonly heading = input('');
  readonly subtitle = input('');
  readonly icon = input('login');
  readonly wide = input(false);
}
