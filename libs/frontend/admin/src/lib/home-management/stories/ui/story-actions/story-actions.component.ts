import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { StoriesStore } from '@mas/frontend-shared-data-access';
import { type Story } from '@mas/prisma-client/browser';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';
import { AddStoryComponent } from '../add-story/add-story.component';

@Component({
  selector: 'mas-story-actions',
  imports: [MatIcon, MatIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center gap-3 h-full">
      <button
        class="!flex !justify-center !content-center"
        mat-icon-button
        [title]="story()?.hidden ? 'Show on home page' : 'Hide from home page'"
        (click)="toggleHidden()"
      >
        <mat-icon>{{ story()?.hidden ? 'visibility_off' : 'visibility' }}</mat-icon>
      </button>
      <button
        class="!flex !justify-center !content-center"
        mat-icon-button
        aria-label="Edit"
        title="Edit"
        (click)="openEdit()"
      >
        <mat-icon color="accent">edit</mat-icon>
      </button>
      <button
        class="!flex !justify-center !content-center"
        mat-icon-button
        aria-label="Delete"
        title="Delete"
        (click)="openConfirm()"
      >
        <mat-icon color="warn">delete</mat-icon>
      </button>
    </div>
  `,
  host: {
    class: 'block h-full',
  },
})
export class StoryActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private storiesStore = inject(StoriesStore);
  story = signal<Story | null>(null);
  agInit(params: ICellRendererParams<Story, unknown, unknown>): void {
    this.story.set(params.data ?? null);
  }

  refresh(params: ICellRendererParams<Story, unknown, unknown>): boolean {
    this.story.set(params.data ?? null);
    return true;
  }

  toggleHidden(): void {
    const item = this.story();
    if (item) {
      this.storiesStore.setEditStoryId(item.id);
      this.storiesStore.patchStory({ hidden: !item.hidden });
    }
  }

  openConfirm() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete Story`,
        content: `Are you sure you want to delete ${this.story()?.name}?`,
        color: 'warn',
        onYesClick: () => {
          const id = this.story()?.id;
          if (id) {
            this.storiesStore.deleteStory(id);
          }
        },
      },
    });
  }

  openEdit() {
    this.dialog.open(AddStoryComponent, {
      data: this.story(),
      panelClass: 'w-full',
    });
  }
}
