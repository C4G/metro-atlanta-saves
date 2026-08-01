import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

type ConfirmData = {
  title: string;
  content: string;
  color: string;
  onYesClick: () => void;
};

@Component({
  selector: 'mas-confirm-dialog',
  imports: [MatDialogModule, MatButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.content }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>No</button>
      <button mat-raised-button mat-dialog-close cdkFocusInitial (click)="data.onYesClick()" [color]="data.color">
        Yes
      </button>
    </mat-dialog-actions>
  `,
  host: {
    class: 'block',
  },
})
export class ConfirmDialogComponent {
  data = inject<ConfirmData>(MAT_DIALOG_DATA);
}
