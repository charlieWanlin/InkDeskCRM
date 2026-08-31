import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  host: { class: 'block' },
  template: `
    <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-fg">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mt-0.5 text-sm text-fg-muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex items-center gap-2"><ng-content /></div>
    </div>
  `,
})
export class PageHeader {
  title = input.required<string>();
  subtitle = input('');
}
