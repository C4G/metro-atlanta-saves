import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ProgramsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-description',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="py-6 sm:py-8" aria-labelledby="overview-heading">
      <div class="overflow-hidden rounded-3xl border border-outline bg-surface-raised">
        <div class="border-b border-outline px-6 py-6 sm:px-8">
          <div class="flex items-start gap-4">
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"
            >
              <mat-icon aria-hidden="true">explore</mat-icon>
            </span>
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Program overview</p>
              <h2 id="overview-heading" class="mt-1 text-2xl font-black tracking-tight">What to expect</h2>
            </div>
          </div>
        </div>
        <div class="px-6 py-7 sm:px-8 sm:py-9">
          @if (programsStore.program()?.description; as description) {
            <div class="rich-content max-w-4xl text-ink-muted" [innerHTML]="description"></div>
          } @else {
            <div class="rounded-2xl border border-dashed border-outline bg-surface-subtle px-6 py-10 text-center">
              <mat-icon class="text-brand-strong" aria-hidden="true">info</mat-icon>
              <h3 class="mt-3 text-lg font-bold">Program details are coming soon</h3>
              <p class="mt-1 text-sm text-ink-muted">Check back here for an overview of this program.</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export default class DescriptionComponent {
  programsStore = inject(ProgramsStore);
}
