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
    <section class="program-list-panel">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="program-list-kicker">Support network</p>
          <h2 class="program-list-title">Allies</h2>
          <p class="program-list-description">People who support this program behind the scenes.</p>
        </div>
        <button mat-raised-button aria-label="Add ally" (click)="openModal()">
          <mat-icon>add</mat-icon>
          Add ally
        </button>
      </div>
      <div class="program-record-list program-people-list" aria-label="Program allies">
        @for (ally of alliesStore.allies(); track ally.userId) {
          <article class="program-record">
            <span class="program-person-avatar">{{ initials(ally.firstName, ally.lastName) }}</span>
            <div class="min-w-0 flex-1">
              <h3 class="program-record-title">{{ ally.firstName }} {{ ally.lastName }}</h3>
              <p class="program-record-meta">{{ ally.email }}</p>
            </div>
            <div class="program-record-detail">
              <span>Last active</span>
              <strong>{{ lastActive(ally.lastLogin) }}</strong>
            </div>
            <button mat-icon-button aria-label="Remove ally" (click)="confirmDelete(ally)">
              <mat-icon>delete_outline</mat-icon>
            </button>
          </article>
        } @empty {
          <div class="program-record-empty">
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
