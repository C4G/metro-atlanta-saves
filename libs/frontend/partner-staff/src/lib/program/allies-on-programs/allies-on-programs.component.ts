import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { AlliesOnProgramsStore } from '@mas/frontend-shared-data-access';
import { AddAlliesOnProgramsComponent } from './ui/add-allies-on-programs/add-allies-on-programs.component';

@Component({
  selector: 'mas-allies-on-programs',
  imports: [MatButtonModule, MatIcon, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
            Support network
          </p>
          <h2 class="mt-1.5 text-xl font-bold tracking-[-0.025em] text-slate-900 dark:text-slate-100">Allies</h2>
          <p class="mt-1.5 text-[0.8125rem] leading-5 text-slate-500 dark:text-slate-400">
            People who support this program behind the scenes.
          </p>
        </div>
        <button
          mat-raised-button
          class="!rounded-xl !bg-teal-700 !text-[0.8125rem] !font-bold !text-cyan-50 dark:!bg-teal-400 dark:!text-teal-950"
          aria-label="Add ally"
          (click)="openModal()"
        >
          <mat-icon>add</mat-icon>
          Add ally
        </button>
      </div>
      <div class="mt-6 grid gap-2.5 program-people-list" aria-label="Program allies">
        @for (ally of alliesStore.allies(); track ally.userId) {
          <article
            class="flex min-h-[5.5rem] items-center gap-3.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-400/15 dark:bg-[#111a2c]"
          >
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-[0.8125rem] font-extrabold text-teal-800 dark:bg-teal-400/15 dark:text-teal-200"
            >
              {{ initials(ally.firstName, ally.lastName) }}
            </span>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
                {{ ally.firstName }} {{ ally.lastName }}
              </h3>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ ally.email }}</p>
            </div>
            <div
              class="grid min-w-[5.5rem] gap-[0.2rem] text-right text-[0.6875rem] text-slate-500 [&_strong]:text-xs [&_strong]:font-bold [&_strong]:text-slate-700 dark:text-slate-400 dark:[&_strong]:text-slate-100"
            >
              <span>Last active</span>
              <strong>{{ lastActive(ally.lastLogin) }}</strong>
            </div>
            <button
              mat-icon-button
              class="!rounded-xl !text-teal-700 dark:!text-teal-300"
              aria-label="Remove ally"
              (click)="confirmDelete(ally)"
            >
              <mat-icon>delete_outline</mat-icon>
            </button>
          </article>
        } @empty {
          <div
            class="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-slate-300 px-6 py-11 text-center text-[0.8125rem] text-slate-500 [&_.mat-icon]:text-teal-700 dark:border-slate-400/25 dark:text-slate-400 dark:[&_.mat-icon]:text-teal-300"
          >
            <mat-icon>diversity_3</mat-icon>
            <p>No allies yet. Add a teammate or partner to support this program.</p>
          </div>
        }
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export default class AlliesOnProgramsComponent {
  id = input.required<string>();
  private dialog = inject(MatDialog);
  protected alliesStore = inject(AlliesOnProgramsStore);
  userOnProgramsEffect = effect(() => {
    const id = this.id();
    untracked(() => {
      this.alliesStore.setProgramId(id);
      this.alliesStore.getAllies();
    });
  });
  initials(firstName: string, lastName: string) {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  }
  lastActive(value: string | null) {
    return value ? new Date(value).toLocaleDateString() : 'Not yet';
  }
  openModal() {
    this.dialog.open(AddAlliesOnProgramsComponent, { panelClass: 'w-full' });
  }
  confirmDelete(ally: { userId: string; firstName: string; lastName: string }) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove ally',
        content: `Remove ${ally.firstName} ${ally.lastName} from this program?`,
        color: 'warn',
        onYesClick: () => this.alliesStore.deleteAlly(ally.userId),
      },
    });
  }
}
