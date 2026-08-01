import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'mas-role-badge',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span>{{ requirements().length || 'No' }} Completed Requirements</span>
  `,
  host: {
    class: 'block',
  },
})
export class RequirementBadgeComponent implements ICellRendererAngularComp {
  requirements = signal<string[]>([]);
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.requirements.set(params.value ?? []);
  }

  refresh(): boolean {
    return false;
  }
}
