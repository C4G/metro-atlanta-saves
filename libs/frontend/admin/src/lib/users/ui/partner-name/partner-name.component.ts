import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatChip } from '@angular/material/chips';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'mas-partner-name',
  imports: [MatChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (name()) {
      <mat-chip>
        {{ name() }}
      </mat-chip>
    }
  `,
  host: {
    class: 'block',
  },
})
export class PartnerNameComponent implements ICellRendererAngularComp {
  name = signal<string>('');
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.name.set(params.data.partner?.name ?? '');
  }

  refresh(): boolean {
    return false;
  }
}
