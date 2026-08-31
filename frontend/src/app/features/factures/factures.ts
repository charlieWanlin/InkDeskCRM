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
import { InvoiceService } from './data/invoice.service';
import { Facture, StatutFacture, toFacture, totalFacture } from './models/facture.model';

// Liste des factures : recherche et tri côté serveur, statut dérivé côté client.
@Component({
  selector: 'app-factures',
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
  templateUrl: './factures.html',
})
export class Factures {
  private service = inject(InvoiceService);
  private router = inject(Router);

  recherche = signal('');
  statutFilter = signal('');
  tri = signal<string>('recent');
  vue = signal<'liste' | 'grille'>('liste');

  private rechercheDebounced = toSignal(
    toObservable(this.recherche).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );
  // Le statut « En retard » est calculé côté front à partir de l'échéance.

  private filters = computed(() => ({
    search: this.rechercheDebounced(),
    sort: this.tri(),
  }));

  private _factures = signal<Facture[]>([]);
  private _loading = signal(true);
  private _error = signal(false);

  factures = this._factures.asReadonly();
  isPending = this._loading.asReadonly();
  isError = this._error.asReadonly();
  total = totalFacture;

  enRetard = computed(() => this._factures().filter((f) => f.statut === 'En retard').length);

  constructor() {

    toObservable(this.filters).subscribe((filtres) => {
      this.page.set(1);
      this.charger(filtres);
    });

    toObservable(this.statutFilter).subscribe(() => this.page.set(1));
  }

  private charger(filters = this.filters()) {
    this._loading.set(true);
    this._error.set(false);
    this.service
      .list(filters)
      .pipe(map((rows) => rows.map(toFacture)))
      .subscribe({
        next: (rows) => {
          this._factures.set(rows);
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
    this.router.navigate(['/factures', id]);
  }

  aSupprimer = signal<Facture | null>(null);

  demanderSuppression(id: number) {
    const facture = this._factures().find((f) => f.id === id) ?? null;
    this.aSupprimer.set(facture);
  }

  annulerSuppression() {
    this.aSupprimer.set(null);
  }

  confirmerSuppression() {
    const facture = this.aSupprimer();
    if (facture) {
      this.service.remove(facture.id).subscribe(() => this.charger());
    }
    this.aSupprimer.set(null);
  }

  facturesTriees = computed(() => {
    const statut = this.statutFilter();
    const liste = this._factures();
    return statut === '' ? liste : liste.filter((f) => f.statut === statut);
  });

  pageSize = 8;
  page = signal(1);
  totalPages = computed(() => Math.max(1, Math.ceil(this.facturesTriees().length / this.pageSize)));
  facturesPage = computed(() => {
    const debut = (this.page() - 1) * this.pageSize;
    return this.facturesTriees().slice(debut, debut + this.pageSize);
  });
  indexDebut = computed(() =>
    this.facturesTriees().length === 0 ? 0 : (this.page() - 1) * this.pageSize + 1,
  );
  indexFin = computed(() => Math.min(this.page() * this.pageSize, this.facturesTriees().length));

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
