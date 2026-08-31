import { Component, computed, inject, signal } from '@angular/core';
import { map } from 'rxjs';
import { Button } from '../../shared/button/button';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { EmptyState } from '../../shared/ui/empty-state';
import { Avatar } from '../../shared/ui/avatar';
import { ProjectService } from '../projets/data/project.service';
import { toRdvItem, toSessionJson, StatutSeance, Seance, RdvItem } from '../projets/models/projet.model';
import { RdvFormModal, RdvFormData } from '../projets/components/rdv-form-modal/rdv-form-modal';

interface GroupeJour {
  cle: string;
  libelle: string;
  estAujourdhui: boolean;
  items: RdvItem[];
}

// Rendez-vous groupés par jour, selon l'onglet actif.
@Component({
  selector: 'app-rendez-vous',
  imports: [Button, Icon, PageHeader, EmptyState, Avatar, RdvFormModal],
  templateUrl: './rendez-vous.html',
})
export class RendezVous {
  private service = inject(ProjectService);

  private _rdvItems = signal<RdvItem[]>([]);
  private _loading = signal(true);
  private _error = signal(false);
  rdvItems = this._rdvItems.asReadonly();
  isLoading = this._loading.asReadonly();
  isError = this._error.asReadonly();

  constructor() {
    this.charger();
  }

  private charger() {
    this._loading.set(true);
    this._error.set(false);
    this.service
      .listSessions()
      .pipe(map((rows) => rows.map(toRdvItem)))
      .subscribe({
        next: (rows) => {
          this._rdvItems.set(rows);
          this._loading.set(false);
        },
        error: () => {
          this._error.set(true);
          this._loading.set(false);
        },
      });
  }

  filtre = signal<'avenir' | 'passes'>('avenir');

  private cleAujourdhui = this.cleDate(new Date());

  private cleDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const j = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${j}`;
  }

  nbAvenir = computed(() => this.rdvItems().filter((r) => r.seance.date >= this.cleAujourdhui).length);
  nbPasses = computed(() => this.rdvItems().filter((r) => r.seance.date < this.cleAujourdhui).length);

  groupes = computed<GroupeJour[]>(() => {
    const avenir = this.filtre() === 'avenir';
    const items = this.rdvItems().filter((r) =>
      avenir ? r.seance.date >= this.cleAujourdhui : r.seance.date < this.cleAujourdhui,
    );

    const parJour = new Map<string, RdvItem[]>();
    for (const item of items) {
      const arr = parJour.get(item.seance.date) ?? [];
      arr.push(item);
      parJour.set(item.seance.date, arr);
    }

    const cles = [...parJour.keys()].sort((a, b) => (avenir ? a.localeCompare(b) : b.localeCompare(a)));

    return cles.map((cle) => {
      const arr = parJour.get(cle)!;
      arr.sort((a, b) => (a.seance.heure ?? '').localeCompare(b.seance.heure ?? ''));
      return {
        cle,
        libelle: this.libelleJour(cle),
        estAujourdhui: cle === this.cleAujourdhui,
        items: arr,
      };
    });
  });

  private libelleJour(cle: string): string {
    const d = new Date(cle + 'T00:00:00');
    const t = d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  rdvOuvert = signal(false);
  seanceEnEdition = signal<Seance | null>(null);
  editProjetId = signal<number | null>(null);
  dateInitiale = signal<string | null>(null);

  ouvrirCreation() {
    this.seanceEnEdition.set(null);
    this.editProjetId.set(null);
    this.dateInitiale.set(null);
    this.rdvOuvert.set(true);
  }

  ouvrirEdition(r: RdvItem) {
    this.seanceEnEdition.set(r.seance);
    this.editProjetId.set(r.projetId);
    this.dateInitiale.set(null);
    this.rdvOuvert.set(true);
  }

  onEnregistrer(data: RdvFormData) {
    if (data.seanceId) {
      this.service.updateSession(data.seanceId, toSessionJson(data)).subscribe(() => this.charger());
    } else {
      this.service.createSession(toSessionJson(data)).subscribe(() => this.charger());
    }
    this.rdvOuvert.set(false);
  }

  onSupprimer(data: RdvFormData) {
    if (data.seanceId) this.service.removeSession(data.seanceId).subscribe(() => this.charger());
    this.rdvOuvert.set(false);
  }

  statutClass(statut: StatutSeance): string {
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
}
