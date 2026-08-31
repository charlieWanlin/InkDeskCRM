import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, of, switchMap } from 'rxjs';
import { Button } from '../../shared/button/button';
import { Icon } from '../../shared/ui/icon';
import { Avatar } from '../../shared/ui/avatar';
import { ProjectService } from './data/project.service';
import {
  avancement,
  seancesFaites,
  totalSeances,
  toutesPhotos,
  toProjet,
  toProjectJson,
  toSessionJson,
  Projet,
  StatutProjet,
  StatutSeance,
  Seance,
} from './models/projet.model';
import { ProjetFormModal, ProjetFormData } from './components/projet-form-modal/projet-form-modal';
import { RdvFormModal, RdvFormData } from './components/rdv-form-modal/rdv-form-modal';
import { QuoteService } from '../devis/data/quote.service';
import { InvoiceService } from '../factures/data/invoice.service';
import { Devis, toDevis, totalDevis } from '../devis/models/devis.model';
import { Facture, toFacture, totalFacture } from '../factures/models/facture.model';

@Component({
  selector: 'app-projet-detail',
  host: { '(document:click)': 'menuOuvert.set(false)' },
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    Button,
    Icon,
    Avatar,
    ProjetFormModal,
    RdvFormModal,
  ],
  templateUrl: './projet-detail.html',
})
export class ProjetDetail {
  private service = inject(ProjectService);
  private quoteService = inject(QuoteService);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  id = input<string>();
  private projetId = computed(() => Number(this.id()));

  private _projet = signal<Projet | null>(null);
  private _loading = signal(true);
  private _error = signal(false);
  projet = this._projet.asReadonly();
  isPending = this._loading.asReadonly();
  isError = this._error.asReadonly();

  private _devis = signal<Devis[]>([]);
  private _factures = signal<Facture[]>([]);

  constructor() {

    toObservable(this.projetId)
      .pipe(
        switchMap((id) => {
          this._loading.set(true);
          this._error.set(false);
          return id > 0 ? this.service.get(id).pipe(map(toProjet)) : of(null);
        }),
      )
      .subscribe({
        next: (p) => {
          this._projet.set(p);
          this._loading.set(false);
        },
        error: () => {
          this._error.set(true);
          this._loading.set(false);
        },
      });

    this.quoteService
      .list()
      .pipe(map((rows) => rows.map(toDevis)))
      .subscribe((r) => this._devis.set(r));
    this.invoiceService
      .list()
      .pipe(map((rows) => rows.map(toFacture)))
      .subscribe((r) => this._factures.set(r));
  }

  reference = computed(() => {
    const p = this.projet();
    return p ? 'PRJ-' + String(p.id).padStart(3, '0') : '';
  });

  avancement = computed(() => {
    const p = this.projet();
    return p ? avancement(p) : 0;
  });
  faites = computed(() => {
    const p = this.projet();
    return p ? seancesFaites(p) : 0;
  });
  total = computed(() => {
    const p = this.projet();
    return p ? totalSeances(p) : 0;
  });
  photos = computed(() => {
    const p = this.projet();
    return p ? toutesPhotos(p) : [];
  });

  devisClient = computed(() => {
    const p = this.projet();
    return p ? this._devis().filter((d) => d.clientId === p.clientId) : [];
  });
  facturesClient = computed(() => {
    const p = this.projet();
    return p ? this._factures().filter((f) => f.clientId === p.clientId) : [];
  });
  totalDevis = totalDevis;
  totalFacture = totalFacture;

  menuOuvert = signal(false);
  confirmationOuverte = signal(false);

  private rechargerProjet() {
    const id = this.projetId();
    if (id > 0) {
      this.service
        .get(id)
        .pipe(map(toProjet))
        .subscribe((p) => this._projet.set(p));
    }
  }

  formOuvert = signal(false);
  onEnregistrerProjet(data: ProjetFormData) {
    const p = this.projet();
    if (p) this.service.update(p.id, toProjectJson(data)).subscribe(() => this.rechargerProjet());
    this.formOuvert.set(false);
  }

  rdvOuvert = signal(false);
  seanceEnEdition = signal<Seance | null>(null);

  ouvrirNouvelleSeance() {
    this.seanceEnEdition.set(null);
    this.rdvOuvert.set(true);
  }
  ouvrirEditionSeance(s: Seance) {
    this.seanceEnEdition.set(s);
    this.rdvOuvert.set(true);
  }
  onEnregistrerRdv(data: RdvFormData) {
    if (data.seanceId) {
      this.service
        .updateSession(data.seanceId, toSessionJson(data))
        .subscribe(() => this.rechargerProjet());
    } else {
      this.service.createSession(toSessionJson(data)).subscribe(() => this.rechargerProjet());
    }
    this.rdvOuvert.set(false);
  }
  onSupprimerRdv(data: RdvFormData) {
    if (data.seanceId)
      this.service.removeSession(data.seanceId).subscribe(() => this.rechargerProjet());
    this.rdvOuvert.set(false);
  }

  basculerSeance(s: Seance) {
    const p = this.projet();
    if (!p) return;
    const nouveau: StatutSeance = s.statut === 'Réalisée' ? 'Planifiée' : 'Réalisée';
    this.service
      .updateSession(
        s.id,
        toSessionJson({
          projetId: p.id,
          titre: s.titre,
          date: s.date,
          heure: s.heure ?? '',
          statut: nouveau,
          notes: s.notes ?? '',
        }),
      )
      .subscribe(() => this.rechargerProjet());
  }

  changerStatutProjet(statut: StatutProjet) {
    const p = this.projet();
    if (p) {
      this.service
        .update(
          p.id,
          toProjectJson({
            clientId: p.clientId,
            titre: p.titre,
            style: p.style,
            zone: p.zone,
            statut,
            montant: p.montant,
            seancesPrevues: p.seancesPrevues,
          }),
        )
        .subscribe(() => this.rechargerProjet());
    }
    this.menuOuvert.set(false);
  }

  supprimer() {
    const p = this.projet();
    if (!p) return;
    this.service.remove(p.id).subscribe(() => this.router.navigate(['/projets']));
    this.confirmationOuverte.set(false);
  }

  statutClass(statut: StatutProjet): string {
    switch (statut) {
      case 'Terminé':
        return 'bg-success-soft text-success';
      case 'En cours':
        return 'bg-primary-soft text-primary';
      case 'En attente':
        return 'bg-warning-soft text-warning';
      default:
        return 'bg-surface-2 text-fg-muted';
    }
  }

  statutSeanceClass(statut: StatutSeance): string {
    switch (statut) {
      case 'Réalisée':
        return 'bg-success-soft text-success';
      case 'Planifiée':
        return 'bg-primary-soft text-primary';
      case 'Annulée':
        return 'bg-danger-soft text-danger';
      default:
        return 'bg-surface-2 text-fg-muted';
    }
  }

  statutDevisClass(statut: string): string {
    if (statut === 'Accepté' || statut === 'Payée') return 'bg-success-soft text-success';
    if (statut === 'Refusé' || statut === 'En retard') return 'bg-danger-soft text-danger';
    if (statut === 'En attente' || statut === 'Envoyé') return 'bg-warning-soft text-warning';
    return 'bg-surface-2 text-fg-muted';
  }
}
