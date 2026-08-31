import { Component, inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { Icon } from '../shared/ui/icon';

interface Crumb {
  label: string;
  link: string;
  last: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink, Icon],
  templateUrl: './breadcrumb.html',
})
export class Breadcrumb {
  private router = inject(Router);

  private labels: Record<string, string> = {
    dashboard: 'Tableau de bord',
    clients: 'Clients',
    'rendez-vous': 'Rendez-vous',
    devis: 'Devis',
    factures: 'Factures',
    projets: 'Projets',
    flash: 'Flash',
    parametres: 'Paramètres',
    profil: 'Profil',
    utilisateurs: 'Utilisateurs',
    nouveau: 'Nouveau',
  };

  crumbs = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.build()),
    ),
    { initialValue: this.build() },
  );

  private build(): Crumb[] {
    const segments = this.router.url.split('?')[0].split('/').filter(Boolean);
    const crumbs: Crumb[] = [{ label: 'Accueil', link: '/dashboard', last: false }];

    let path = '';
    for (const seg of segments) {
      path += '/' + seg;

      if (seg === 'dashboard') continue;
      const label = this.labels[seg] ?? (/^\d+$/.test(seg) ? 'Fiche' : seg);
      crumbs.push({ label, link: path, last: false });
    }

    crumbs[crumbs.length - 1].last = true;
    return crumbs;
  }
}
