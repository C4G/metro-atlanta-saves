import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'mas-section-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="h-full overflow-hidden rounded-2xl border border-outline/65 bg-surface/60"
      [attr.aria-labelledby]="headingId()"
    >
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-outline/55 px-5 py-4">
        <div class="flex items-center gap-2.5">
          <h2 class="text-base font-bold text-ink" [id]="headingId()">{{ heading() }}</h2>
          @if (tag()) {
            <span class="rounded-full border border-ink-muted/45 px-2 py-0.5 text-xs font-bold text-ink-muted">
              {{ tag() }}
            </span>
          }
          @if (count() !== null) {
            <span class="rounded-full bg-brand-soft/80 px-2 py-0.5 text-xs font-bold text-brand-strong">
              {{ count() }}
            </span>
          }
        </div>
        <ng-content select="[panelActions]" />
      </div>
      <ng-content />
    </section>
  `,
  host: { class: 'block' },
})
export class SectionPanelComponent {
  readonly heading = input.required<string>();
  readonly headingId = input.required<string>();
  readonly count = input<number | null>(null);
  readonly tag = input('');
}
