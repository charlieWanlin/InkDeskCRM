import { Component, input, model } from '@angular/core';
import { SearchInput } from './search-input';

@Component({
  selector: 'app-list-toolbar',
  host: { class: 'block' },
  imports: [SearchInput],
  template: `
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <app-search-input class="w-full max-w-md" [(value)]="search" [placeholder]="placeholder()" />
      <div class="flex items-center gap-2"><ng-content /></div>
    </div>
  `,
})
export class ListToolbar {
  search = model('');
  placeholder = input('Rechercher…');
}
