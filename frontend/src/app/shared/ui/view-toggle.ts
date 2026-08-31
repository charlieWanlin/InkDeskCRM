import { Component, model } from '@angular/core';

@Component({
  selector: 'app-view-toggle',
  host: { class: 'contents' },
  template: `
    <div class="hidden rounded-lg border border-border bg-surface p-0.5 md:inline-flex">
      <button
        type="button"
        (click)="vue.set('liste')"
        title="Vue liste"
        class="grid h-8 w-8 place-items-center rounded-md transition"
        [class]="vue() === 'liste' ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:text-fg'"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      </button>
      <button
        type="button"
        (click)="vue.set('grille')"
        title="Vue grille"
        class="grid h-8 w-8 place-items-center rounded-md transition"
        [class]="vue() === 'grille' ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:text-fg'"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>
    </div>
  `,
})
export class ViewToggle {
  vue = model<'liste' | 'grille'>('liste');
}
