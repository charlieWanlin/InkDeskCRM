import { Component, input, output } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-search-input',
  host: { class: 'block' },
  imports: [Icon],
  template: `
    <div class="relative">
      <app-icon
        name="search"
        [size]="16"
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
      />
      <input
        #box
        type="search"
        [placeholder]="placeholder()"
        [attr.aria-label]="placeholder()"
        [value]="value()"
        (input)="valueChange.emit(box.value)"
        class="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-fg outline-none transition placeholder:text-fg-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  `,
})
export class SearchInput {

  value = input('');

  valueChange = output<string>();
  placeholder = input('Rechercher…');
}
