import { Component, computed, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Avatar } from './avatar';
import { Icon } from './icon';
import { ClientMini } from '../data/clients-repo';

@Component({
  selector: 'app-client-picker',
  imports: [FormsModule, Avatar, Icon],
  template: `
    @if (ouvert()) {
      <div class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
        <button
          type="button"
          aria-label="Fermer"
          class="absolute inset-0 h-full w-full cursor-default"
          (click)="fermer()"
        ></button>
        <div
          class="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-border bg-surface shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
        >
          <div class="flex items-center justify-between border-b border-border p-4">
            <h3 class="text-lg font-bold text-fg">{{ titre() }}</h3>
            <button
              (click)="fermer()"
              class="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <app-icon name="close" [size]="16" />
            </button>
          </div>

          <div class="border-b border-border p-3">
            <div
              class="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
            >
              <app-icon name="search" [size]="16" />
              <input
                [(ngModel)]="recherche"
                placeholder="Rechercher un client…"
                class="h-full w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
              />
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-2">
            @for (c of filtres(); track c.id) {
              <button
                (click)="choisir(c)"
                class="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-primary-soft"
              >
                <app-avatar size="md" [initials]="c.initiales" />
                <span class="flex-1 text-sm font-semibold text-fg">{{ c.nom }}</span>
                <app-icon name="chevron-right" [size]="16" />
              </button>
            } @empty {
              <p class="px-3 py-8 text-center text-sm text-fg-subtle">
                Aucun client ne correspond.
              </p>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class ClientPicker {

  clients = input<ClientMini[]>([]);

  ouvert = model(false);
  titre = input('Sélectionner un client');
  choisi = output<ClientMini>();

  recherche = signal('');

  filtres = computed(() => {
    const q = this.recherche().trim().toLowerCase();
    const liste = this.clients();
    return q === '' ? liste : liste.filter((c) => c.nom.toLowerCase().includes(q));
  });

  choisir(c: ClientMini) {
    this.choisi.emit(c);
    this.fermer();
  }

  fermer() {
    this.ouvert.set(false);
    this.recherche.set('');
  }
}
