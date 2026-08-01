import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'mas-description-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p class="whitespace-pre-wrap leading-relaxed">{{ data.description }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
})
export class DescriptionDialogComponent {
  data = inject<{ title: string; description: string }>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'mas-description-cell-renderer',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ description }}
  `,
  host: {
    class: 'block truncate cursor-pointer',
    '(dblclick)': 'onDblClick()',
    title: 'Double-click to view full description',
  },
})
export class DescriptionCellRendererComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);

  description = '';
  private rowTitle = '';

  agInit(params: ICellRendererParams): void {
    this.description = params.value ?? '';
    this.rowTitle = params.data?.title ?? 'Description';
  }

  refresh(params: ICellRendererParams): boolean {
    this.description = params.value ?? '';
    this.rowTitle = params.data?.title ?? 'Description';
    return true;
  }

  onDblClick() {
    this.dialog.open(DescriptionDialogComponent, {
      data: { title: this.rowTitle, description: this.description },
      width: '600px',
      maxWidth: '90vw',
    });
  }
}
