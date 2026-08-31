import { Component, inject } from '@angular/core';
import { StudioService } from './studio.service';

// En-tête réutilisé par les devis et factures, synchronisé avec les réglages du studio.

@Component({
  selector: 'app-studio-letterhead',
  template: `
    <p class="font-bold text-fg">{{ studio()?.name }}</p>
    @if (studio()?.subtitle) {
      <p class="text-sm text-fg-muted">{{ studio()?.subtitle }}</p>
    }
    @if (studio()?.address) {
      <p class="text-sm text-fg-muted">{{ studio()?.address }}</p>
    }
  `,
})
export class StudioLetterhead {
  studio = inject(StudioService).studio;
}
