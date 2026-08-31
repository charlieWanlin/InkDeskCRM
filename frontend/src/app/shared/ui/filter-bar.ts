import { Component } from '@angular/core';

@Component({
  selector: 'app-filter-bar',
  host: { class: 'block' },
  template: `
    <div class="flex flex-wrap items-center gap-2 border-b border-border p-4">
      <ng-content />
    </div>
  `,
})
export class FilterBar {}
