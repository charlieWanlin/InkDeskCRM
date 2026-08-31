import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-avatar',
  host: { class: 'contents' },
  template: `
    @if (photo()) {
      <img [src]="photo()" [alt]="initials()" [class]="classes() + ' object-cover'" />
    } @else {
      <span [class]="classes()">{{ initials() }}</span>
    }
  `,
})
export class Avatar {
  initials = input.required<string>();
  photo = input<string | null>(null);
  size = input<'sm' | 'md' | 'lg'>('md');

  classes = computed(() => {
    const base =
      'grid place-items-center rounded-full bg-surface-2 font-semibold text-fg-muted ring-1 ring-border';
    const sizes = { sm: 'h-8 w-8 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' };
    return `${base} ${sizes[this.size()]}`;
  });
}
