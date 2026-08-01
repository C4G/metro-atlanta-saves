import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '@mas/frontend-shared-layout';

@Component({
  imports: [RouterModule, LayoutComponent],
  selector: 'mas-root',
  host: {
    class: 'block',
  },
  template: `
    <mas-layout>
      <router-outlet />
    </mas-layout>
  `,
})
export class AppComponent {}
