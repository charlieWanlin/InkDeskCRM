import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  template: `<span [class]="classes()">{{ label() }}</span>`,
})
export class StatusBadge {
  status = input.required<string>();

  label = computed(() => {
    switch (this.status()) {
      case 'actif':
        return 'Actif';
      case 'prospect':
        return 'Prospect';
      case 'inactif':
        return 'Inactif';
      default:
        return this.status();
    }
  });

  classes = computed(() => {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    switch (this.status()) {
      case 'actif':
        return base + ' bg-success-soft text-success';
      case 'prospect':
        return base + ' bg-warning-soft text-warning';
      default:
        return base + ' bg-surface-2 text-fg-muted';
    }
  });
}
