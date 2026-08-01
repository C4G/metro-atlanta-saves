import { ChangeDetectionStrategy, Component, inject, input, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type ColDef } from 'ag-grid-community';
import { ThemeService } from '@mas/frontend-shared-data-access';
import { AgGridAngular } from 'ag-grid-angular';

@Component({
  selector: 'mas-ag-grid',
  imports: [AgGridAngular],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block min-h-96',
  },
  template: `
    @if (isBrowser) {
      <ag-grid-angular
        [class]="themeService.darkMode() ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'"
        [rowData]="rowData()"
        [columnDefs]="columnDefs()"
        [enableCellTextSelection]="true"
        [rowHeight]="48"
        class="h-full min-h-96"
      />
    } @else {
      <div class="flex items-center justify-center h-full min-h-96">
        <p>Loading table...</p>
      </div>
    }
  `,
  styleUrls: [
    '../../../../../../../node_modules/ag-grid-community/styles/ag-grid.min.css',
    '../../../../../../../node_modules/ag-grid-community/styles/ag-theme-quartz.min.css',
  ],
  encapsulation: ViewEncapsulation.None,
})
export class AgGridComponent {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  themeService = inject(ThemeService);
  columnDefs = input.required<ColDef[]>();
  rowData = input.required<unknown[]>();
}
