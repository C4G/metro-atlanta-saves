import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ICON_CONTROL } from './staff-ui';

@Component({
  selector: 'mas-window-frame',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="flex max-h-[calc(100dvh-6rem)] w-full flex-col overflow-hidden rounded-2xl border border-outline/65 bg-surface/90 text-ink shadow-xl backdrop-blur-lg backdrop-saturate-150"
      [attr.aria-labelledby]="headingId()"
    >
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-outline/55 py-3 pl-4 pr-3 sm:py-4 sm:pl-5 sm:pr-4"
      >
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <ng-content select="[windowLead]" />
          <div class="min-w-0">
            <h2 class="text-xl font-bold leading-7" [id]="headingId()">{{ heading() }}</h2>
            @if (subtitle()) {
              <p class="truncate text-xs text-ink-muted">{{ subtitle() }}</p>
            }
          </div>
        </div>
        <ng-content select="[windowActions]" />
        <button type="button" [class]="closeClass" aria-label="Close" [disabled]="busy()" (click)="dialogRef.close()">
          <mat-icon class="mas-icon-md" aria-hidden="true">close</mat-icon>
        </button>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <ng-content />
      </div>
      <div
        class="flex flex-wrap items-center justify-end gap-2 border-t border-outline/55 px-4 py-3 empty:hidden [&>*]:flex-1 sm:[&>*]:flex-none"
      >
        <ng-content select="[windowFooter]" />
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export class WindowFrameComponent {
  readonly heading = input.required<string>();
  readonly headingId = input.required<string>();
  readonly subtitle = input('');
  readonly busy = input(false);
  readonly dialogRef = inject(MatDialogRef);
  readonly closeClass = ICON_CONTROL;
}
