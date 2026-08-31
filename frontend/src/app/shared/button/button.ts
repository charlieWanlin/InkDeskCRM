import { Component, input, computed } from '@angular/core';

// Le host sans boîte laisse le bouton hériter du flex parent.
@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  host: { class: 'contents' },
})
export class Button {
  variant = input<'primary' | 'secondary' | 'gold' | 'ghost' | 'danger'>('primary');
  size = input<'sm' | 'md'>('md');
  type = input<'button' | 'submit'>('button');
  disabled = input(false);
  loading = input(false);

  classes = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none';
    const sizes = { sm: 'rounded-md px-3 py-1.5 text-xs', md: 'rounded-lg px-4 py-2 text-sm' };
    const variantes = {
      primary: 'bg-primary text-white hover:bg-primary-hover',
      secondary: 'border border-border bg-surface text-fg hover:bg-surface-2',
      gold: 'bg-gold text-white hover:opacity-90',
      ghost: 'text-fg-muted hover:bg-surface-2 hover:text-fg',
      danger: 'bg-danger text-white hover:opacity-90',
    };
    return `${base} ${sizes[this.size()]} ${variantes[this.variant()]}`;
  });
}
