import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { Button } from '../../shared/button/button';
import { Pagination } from '../../shared/pagination/pagination';
import { ListToolbar } from '../../shared/ui/list-toolbar';
import { ViewToggle } from '../../shared/ui/view-toggle';
import { FilterBar } from '../../shared/ui/filter-bar';
import { Select } from '../../shared/ui/select';
import { Avatar } from '../../shared/ui/avatar';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { EmptyState } from '../../shared/ui/empty-state';
import { ProjectService } from './data/project.service';
import {
  avancement,
  seancesFaites,
  totalSeances,
  toProjet,
  toProjectJson,
  StatutProjet,
  Projet,
} from './models/projet.model';
import { ProjetFormModal, ProjetFormData } from './components/projet-form-modal/projet-form-modal';

// Liste des projets : filtres et tri côté serveur, recherche temporisée.
@Component({
  selector: 'app-projets',
  imports: [
    RouterLink,
    CurrencyPipe,
    Button,
    Pagination,
    ListToolbar,
    ViewToggle,
    FilterBar,
    Select,
    Avatar,
    Icon,
    PageHeader,
    EmptyState,
    ProjetFormModal,
  ],
  templateUrl: './projets.html',
})
export class Projets {
  private service = inject(ProjectService);
  private router = inject(Router);

  recherche = signal('');
  statutFilter = signal('');
  tri = signal<string>('recent');
  vue = signal<'liste' | 'grille'>('liste');

  private rechercheDebounced = toSignal(
    toObservable(this.recherche).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );
  private filters = computed(() => ({
    search: this.rechercheDebounced(),
    status: this.statutFilter(),
    sort: this.tri(),
  }));

  private _projets = signal<Projet[]>([]);
  private _loading = signal(true);
  private _error = signal(false);

  projets = this._projets.asReadonly();
  isPending = this._loading.asReadonly();
  isError = this._error.asReadonly();

  avancement = avancement;
  faites = seancesFaites;
  totalSeances = totalSeances;

  enCours = computed(() => this._projets().filter((p) => p.statut === 'En cours').length);

  constructor() {

    toObservable(this.filters).subscribe((filtres) => {
      this.page.set(1);
      this.charger(filtres);
    });
  }

  private charger(filters = this.filters()) {
    this._loading.set(true);
    this._error.set(false);
    this.service
      .list(filters)
      .pipe(map((rows) => rows.map(toProjet)))
      .subscribe({
        next: (rows) => {
          this._projets.set(rows);
          this._loading.set(false);
        },
        error: () => {
          this._error.set(true);
          this._loading.set(false);
        },
      });
  }

  reload = () => this.charger();

  formOuvert = signal(false);
  projetEnEdition = signal<Projet | null>(null);

  ouvrirCreation() {
    this.projetEnEdition.set(null);
    this.formOuvert.set(true);
  }
  ouvrirEdition(p: Projet) {
    this.projetEnEdition.set(p);
    this.formOuvert.set(true);
  }
  onEnregistrer(data: ProjetFormData) {
    const enEdition = this.projetEnEdition();
    if (enEdition) {
      this.service.update(enEdition.id, toProjectJson(data)).subscribe(() => this.charger());
    } else {
      this.service.create(toProjectJson(data)).subscribe((projet) => {
        this.charger();
        this.router.navigate(['/projets', projet.id]);
      });
    }
    this.formOuvert.set(false);
  }

  ouvrirDetail(id: number) {
    this.router.navigate(['/projets', id]);
  }

  aSupprimer = signal<Projet | null>(null);

  demanderSuppression(id: number) {
    const projet = this._projets().find((p) => p.id === id) ?? null;
    this.aSupprimer.set(projet);
  }

  annulerSuppression() {
    this.aSupprimer.set(null);
  }

  confirmerSuppression() {
    const projet = this.aSupprimer();
    if (projet) {
      this.service.remove(projet.id).subscribe(() => this.charger());
    }
    this.aSupprimer.set(null);
  }

  projetsTries = computed(() => this._projets());

  pageSize = 8;
  page = signal(1);
  totalPages = computed(() => Math.max(1, Math.ceil(this.projetsTries().length / this.pageSize)));
  projetsPage = computed(() => {
    const debut = (this.page() - 1) * this.pageSize;
    return this.projetsTries().slice(debut, debut + this.pageSize);
  });
  indexDebut = computed(() =>
    this.projetsTries().length === 0 ? 0 : (this.page() - 1) * this.pageSize + 1,
  );
  indexFin = computed(() => Math.min(this.page() * this.pageSize, this.projetsTries().length));

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
}
