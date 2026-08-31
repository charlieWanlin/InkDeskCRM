import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { StudioLetterhead } from '../../core/studio/studio-letterhead';
import { InvoiceService } from './data/invoice.service';
import {
  Facture,
  LigneFacture,
  StatutFacture,
  totalFacture,
  toFacture,
  toInvoiceJson,
} from './models/facture.model';
import { ClientService } from '../clients/data/client.service';
import { toClient } from '../clients/models/client.model';
import { ProjectService } from '../projets/data/project.service';
import { toProjet } from '../projets/models/projet.model';

@Component({
  selector: 'app-facture-detail',
  imports: [RouterLink, StudioLetterhead],
  templateUrl: './facture-detail.html',
})
export class FactureDetail {
  private service = inject(InvoiceService);
  private clientService = inject(ClientService);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  id = input<string>();
  private invoiceId = computed(() => Number(this.id()));

  private _facture = signal<Facture | null>(null);

  private _clients = signal<ReturnType<typeof toClient>[]>([]);
  clients = this._clients.asReadonly();
  private _projets = signal<ReturnType<typeof toProjet>[]>([]);
  projets = this._projets.asReadonly();

  constructor() {

    toObservable(this.invoiceId)
      .pipe(switchMap((id) => (id > 0 ? this.service.get(id).pipe(map(toFacture)) : of(null))))
      .subscribe((f) => this._facture.set(f));

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
    const id = this.invoiceId();
    if (id > 0) {
      this.service
        .get(id)
        .pipe(map(toFacture))
        .subscribe((f) => this._facture.set(f));
    }
  }

  // Copie locale synchronisée au chargement pour isoler les modifications non enregistrées.
  doc = linkedSignal(() => this._facture());
  document = this.doc;

  total = computed(() => {
    const f = this.doc();
    return f ? totalFacture(f) : 0;
  });

  menuOuvert = signal(false);
  confirmationOuverte = signal(false);
  statutMenu = signal(false);
  statutsDispo: StatutFacture[] = ['Brouillon', 'En attente', 'Payée', 'En retard'];

  private patchDoc(patch: Partial<Facture>) {
    const f = this.doc();
    if (f) this.doc.set({ ...f, ...patch });
  }

  changerStatut(statut: StatutFacture) {
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

  totalLigne(l: LigneFacture): number {
    return l.quantite * l.prixUnitaire;
  }

  ajouterLigne() {
    const f = this.doc();
    if (!f) return;
    const ligneId = Math.max(0, ...f.lignes.map((l) => l.id)) + 1;
    this.patchDoc({
      lignes: [...f.lignes, { id: ligneId, designation: '', quantite: 1, prixUnitaire: 0 }],
    });
  }

  supprimerLigne(l: LigneFacture) {
    const f = this.doc();
    if (f) this.patchDoc({ lignes: f.lignes.filter((x) => x.id !== l.id) });
  }

  majLigne(l: LigneFacture, champ: 'designation' | 'quantite' | 'prixUnitaire', valeur: string) {
    const f = this.doc();
    if (!f) return;
    const v = champ === 'designation' ? valeur : Number(valeur) || 0;
    this.patchDoc({ lignes: f.lignes.map((x) => (x.id === l.id ? { ...x, [champ]: v } : x)) });
  }

  enregistrer() {
    const f = this.doc();
    if (f) {
      this.service.update(f.id, toInvoiceJson(f)).subscribe(() => this.recharger());
    }
  }

  supprimer() {
    const f = this.doc();
    if (f) {
      this.service.remove(f.id).subscribe(() => this.router.navigate(['/factures']));
    }
    this.confirmationOuverte.set(false);
  }

  private contacts: Record<number, { email: string; telephone: string }> = {
    1: { email: 'lea.martin@example.com', telephone: '06 12 34 56 78' },
    2: { email: 'hugo.bernard@example.com', telephone: '06 78 90 12 34' },
    3: { email: 'camille.petit@example.com', telephone: '06 99 88 77 66' },
  };
  contact = computed(() => {
    const f = this.doc();
    return f ? (this.contacts[f.clientId] ?? null) : null;
  });

  imprimer() {
    window.print();
  }

  statutClass(statut: StatutFacture): string {
    switch (statut) {
      case 'Payée':
        return 'bg-success-soft text-success';
      case 'En attente':
        return 'bg-warning-soft text-warning';
      case 'En retard':
        return 'bg-danger-soft text-danger';
      default:
        return 'bg-surface-2 text-fg-muted';
    }
  }
}
