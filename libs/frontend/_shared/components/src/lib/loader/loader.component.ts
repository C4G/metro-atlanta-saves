import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'mas-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="status"
      class="flex min-h-56 items-center justify-center rounded-2xl border border-outline bg-surface-raised p-8"
    >
      <span
        aria-hidden="true"
        class="h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand motion-reduce:animate-[spin_1.6s_linear_infinite]"
      ></span>
      <span class="sr-only">{{ label() }}</span>
    </div>
  `,
  host: { class: 'block' },
})
export class LoaderComponent {
  readonly label = input.required<string>();
}
