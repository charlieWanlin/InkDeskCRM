import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { StudioLetterhead } from '../../core/studio/studio-letterhead';
import { QuoteService } from './data/quote.service';
import {
  Devis,
  LigneDevis,
  StatutDevis,
  totalDevis,
  toDevis,
  toQuoteJson,
} from './models/devis.model';
import { ClientService } from '../clients/data/client.service';
import { toClient } from '../clients/models/client.model';
import { ProjectService } from '../projets/data/project.service';
import { toProjet } from '../projets/models/projet.model';
import { InvoiceService } from '../factures/data/invoice.service';

@Component({
  selector: 'app-devis-detail',
  imports: [RouterLink, StudioLetterhead],
  templateUrl: './devis-detail.html',
})
export class DevisDetail {
  private service = inject(QuoteService);
  private clientService = inject(ClientService);
  private projectService = inject(ProjectService);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  id = input<string>();
  private quoteId = computed(() => Number(this.id()));

  private _quote = signal<Devis | null>(null);

  private _clients = signal<ReturnType<typeof toClient>[]>([]);
  clients = this._clients.asReadonly();
  private _projets = signal<ReturnType<typeof toProjet>[]>([]);
  projets = this._projets.asReadonly();

  constructor() {

    toObservable(this.quoteId)
      .pipe(switchMap((id) => (id > 0 ? this.service.get(id).pipe(map(toDevis)) : of(null))))
      .subscribe((d) => this._quote.set(d));

    this.clientService
      .list()
      .pipe(map((rows) => rows.map(toClient)))
      .subscribe((r) => this._clients.set(r));
    this.projectService
      .list()
      .pipe(map((rows) => rows.map(toProjet)))
      .subscribe((r) => this._projets.set(r));
  }

  private recharger() {
    const id = this.quoteId();
    if (id > 0) {
      this.service
        .get(id)
        .pipe(map(toDevis))
        .subscribe((d) => this._quote.set(d));
    }
  }

  // Copie locale synchronisée au chargement, modifiable sans requête par frappe.

  doc = linkedSignal(() => this._quote());
  document = this.doc; // Alias conservé pour le template.

  total = computed(() => {
    const d = this.doc();
    return d ? totalDevis(d) : 0;
  });

  menuOuvert = signal(false);
  confirmationOuverte = signal(false);
  statutMenu = signal(false);
  statutsDispo: StatutDevis[] = ['Brouillon', 'Envoyé', 'Accepté', 'Refusé'];

  private patchDoc(patch: Partial<Devis>) {
    const d = this.doc();
    if (d) this.doc.set({ ...d, ...patch });
  }

  changerStatut(statut: StatutDevis) {
    this.patchDoc({ statut });
  }

  changerClient(id: string) {
    const c = this.clients().find((x) => x.id === Number(id));
    if (c) {
      this.patchDoc({
        clientId: c.id,
        clientNom: `${c.firstName} ${c.lastName}`.trim(),
        initiales: ((c.firstName[0] ?? '') + (c.lastName[0] ?? '')).toUpperCase(),
      });
    }
  }

  changerProjet(id: string) {
    const pid = Number(id) || null;
    const p = this.projets().find((x) => x.id === pid);
    this.patchDoc({ projetId: pid, projet: p?.titre ?? '' });
  }

  totalLigne(l: LigneDevis): number {
    return l.quantite * l.prixUnitaire;
  }

  ajouterLigne() {
    const d = this.doc();
    if (!d) return;
    const ligneId = Math.max(0, ...d.lignes.map((l) => l.id)) + 1;
    this.patchDoc({
      lignes: [...d.lignes, { id: ligneId, designation: '', quantite: 1, prixUnitaire: 0 }],
    });
  }

  supprimerLigne(l: LigneDevis) {
    const d = this.doc();
    if (d) this.patchDoc({ lignes: d.lignes.filter((x) => x.id !== l.id) });
  }

  majLigne(l: LigneDevis, champ: 'designation' | 'quantite' | 'prixUnitaire', valeur: string) {
    const d = this.doc();
    if (!d) return;
    const v = champ === 'designation' ? valeur : Number(valeur) || 0;
    this.patchDoc({ lignes: d.lignes.map((x) => (x.id === l.id ? { ...x, [champ]: v } : x)) });
  }

  enregistrer() {
    const d = this.doc();
    if (d) this.service.update(d.id, toQuoteJson(d)).subscribe(() => this.recharger());
  }

  supprimer() {
    const d = this.doc();
    if (d) this.service.remove(d.id).subscribe(() => this.router.navigate(['/devis']));
    this.confirmationOuverte.set(false);
  }

  convertirEnFacture() {
    const d = this.doc();
    if (!d) return;
    this.invoiceService
      .fromQuote(d.id)
      .pipe(
        switchMap((facture) =>
          this.service
            .update(d.id, toQuoteJson({ ...d, statut: 'Accepté' }))
            .pipe(map(() => facture)),
        ),
      )
      .subscribe((facture) => this.router.navigate(['/factures', facture.id]));
  }

  private contacts: Record<number, { email: string; telephone: string }> = {
    1: { email: 'lea.martin@example.com', telephone: '06 12 34 56 78' },
    2: { email: 'hugo.bernard@example.com', telephone: '06 78 90 12 34' },
    3: { email: 'camille.petit@example.com', telephone: '06 99 88 77 66' },
  };
  contact = computed(() => {
    const d = this.doc();
    return d ? (this.contacts[d.clientId] ?? null) : null;
  });

  imprimer() {
    window.print();
  }

  statutClass(statut: StatutDevis): string {
    switch (statut) {
      case 'Accepté':
        return 'bg-success-soft text-success';
      case 'Envoyé':
        return 'bg-info-soft text-info';
      case 'Refusé':
        return 'bg-danger-soft text-danger';
      default:
        return 'bg-surface-2 text-fg-muted';
    }
  }
}
