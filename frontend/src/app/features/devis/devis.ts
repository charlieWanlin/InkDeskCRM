import { Component, computed, signal, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
import { QuoteService } from './data/quote.service';
import { Devis as DevisModel, StatutDevis, toDevis, totalDevis } from './models/devis.model';

// Liste des devis : filtres et tri côté serveur, recherche temporisée.
@Component({
  selector: 'app-devis',
  imports: [
    RouterLink,
    DatePipe,
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
  ],
  templateUrl: './devis.html',
})
export class Devis {
  private service = inject(QuoteService);
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

  private _devis = signal<DevisModel[]>([]);
  private _loading = signal(true);
  private _error = signal(false);

  devis = this._devis.asReadonly();
  isPending = this._loading.asReadonly();
  isError = this._error.asReadonly();
  total = totalDevis;

  enAttente = computed(() => this._devis().filter((d) => d.statut === 'Envoyé').length);

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
      .pipe(map((rows) => rows.map(toDevis)))
      .subscribe({
        next: (rows) => {
          this._devis.set(rows);
          this._loading.set(false);
        },
        error: () => {
          this._error.set(true);
          this._loading.set(false);
        },
      });
  }

  reload = () => this.charger();

  ouvrirEdition(id: number) {
    this.router.navigate(['/devis', id]);
  }

  aSupprimer = signal<DevisModel | null>(null);

  demanderSuppression(id: number) {
    const devis = this._devis().find((d) => d.id === id) ?? null;
    this.aSupprimer.set(devis);
  }

  annulerSuppression() {
    this.aSupprimer.set(null);
  }

  confirmerSuppression() {
    const devis = this.aSupprimer();
    if (devis) {
      this.service.remove(devis.id).subscribe(() => this.charger());
    }
    this.aSupprimer.set(null);
  }
  devisTries = computed(() => this._devis());

  pageSize = 8;
  page = signal(1);
  totalPages = computed(() => Math.max(1, Math.ceil(this.devisTries().length / this.pageSize)));
  devisPage = computed(() => {
    const debut = (this.page() - 1) * this.pageSize;
    return this.devisTries().slice(debut, debut + this.pageSize);
  });
  indexDebut = computed(() =>
    this.devisTries().length === 0 ? 0 : (this.page() - 1) * this.pageSize + 1,
  );
  indexFin = computed(() => Math.min(this.page() * this.pageSize, this.devisTries().length));

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
