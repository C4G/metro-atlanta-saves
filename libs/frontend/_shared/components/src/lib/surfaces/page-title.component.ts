import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'mas-page-title',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <h1 class="px-1 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{{ title() }}</h1>
      <ng-content />
    </div>
  `,
  host: { class: 'block' },
})
export class PageTitleComponent {
  readonly title = input.required<string>();
}
