import { Component, input } from '@angular/core';
import { Icon, IconName } from './icon';

@Component({
  selector: 'app-empty-state',
  host: { class: 'block' },
  imports: [Icon],
  template: `
    <div
      class="grid place-items-center rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center"
    >
      <span class="mb-3 grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-fg-subtle">
        <app-icon [name]="icon()" [size]="22" />
      </span>
      <p class="font-semibold text-fg">{{ title() }}</p>
      @if (subtitle()) {
        <p class="mb-4 mt-1 text-sm text-fg-muted">{{ subtitle() }}</p>
      }
      <div><ng-content /></div>
    </div>
  `,
})
export class EmptyState {
  title = input.required<string>();
  subtitle = input('');
  icon = input<IconName>('inbox');
}
