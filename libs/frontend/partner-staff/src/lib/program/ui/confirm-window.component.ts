import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { CONTROL, CONTROL_DANGER } from './staff-ui';

export type ConfirmWindowData = {
  initials: string;
  icon: string;
  heading: string;
  detail: string;
  points: { text: string; isKept: boolean }[];
  keepLabel: string;
  confirmLabel: string;
};

@Component({
  selector: 'mas-confirm-window',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      role="alertdialog"
      aria-labelledby="confirm-window-heading"
      class="flex flex-col items-center gap-4 rounded-2xl border border-outline/65 bg-surface/90 p-6 text-center text-ink shadow-xl backdrop-blur-lg backdrop-saturate-150"
    >
      <span
        class="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft/80 text-lg font-bold text-brand-strong"
        aria-hidden="true"
      >
        {{ data.initials }}
        <span
          class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-surface bg-danger text-brand-on"
        >
          <mat-icon class="mas-icon-sm">{{ data.icon }}</mat-icon>
        </span>
      </span>
      <div>
        <h2 id="confirm-window-heading" class="text-lg font-bold">{{ data.heading }}</h2>
        <p class="mt-1 text-sm text-ink-muted">{{ data.detail }}</p>
      </div>
      @if (data.points.length) {
        <ul
          class="flex w-full flex-col gap-2 rounded-xl border border-outline/45 bg-surface-subtle/50 px-4 py-3 text-left text-sm"
        >
          @for (point of data.points; track point.text) {
            <li class="flex items-center gap-2">
              <mat-icon
                class="mas-icon-sm shrink-0"
                [class]="point.isKept ? 'text-brand-strong' : 'text-danger'"
                aria-hidden="true"
              >
                {{ point.isKept ? 'check' : 'do_not_disturb_on' }}
              </mat-icon>
              {{ point.text }}
            </li>
          }
        </ul>
      }
      <div class="grid w-full grid-cols-2 gap-2">
        <button type="button" [class]="keepClass" cdkFocusInitial (click)="dialogRef.close(false)">
          {{ data.keepLabel }}
        </button>
        <button type="button" [class]="confirmClass" (click)="dialogRef.close(true)">{{ data.confirmLabel }}</button>
      </div>
    </section>
  `,
})
export class ConfirmWindowComponent {
  readonly data = inject<ConfirmWindowData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfirmWindowComponent, boolean>);
  readonly keepClass = CONTROL;
  readonly confirmClass = CONTROL_DANGER;
}
