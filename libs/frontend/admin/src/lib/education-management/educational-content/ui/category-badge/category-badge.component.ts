import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'mas-category-badge',
  imports: [MatChipSet, MatChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-chip-set>
      @for (category of categories(); track category) {
        <mat-chip>
          {{ category }}
        </mat-chip>
      }
    </mat-chip-set>
  `,
  host: {
    class: 'block',
  },
})
export class CategoryBadgeComponent implements ICellRendererAngularComp {
  categories = signal<string[]>([]);
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.categories.set(params.value);
  }

  refresh(): boolean {
    return false;
  }
}
