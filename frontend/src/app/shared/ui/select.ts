import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-select',
  imports: [FormsModule],
  host: { class: 'contents' },
  template: `
    <select
      [ngModel]="value()"
      (ngModelChange)="value.set($event)"
      class="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-fg-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
    >
      <ng-content />
    </select>
  `,
})
export class Select {
  value = model<string>('');
}
