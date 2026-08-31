import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { Button } from '../../shared/button/button';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { FilterBar } from '../../shared/ui/filter-bar';
import { Select } from '../../shared/ui/select';
import { EmptyState } from '../../shared/ui/empty-state';
import { ListToolbar } from '../../shared/ui/list-toolbar';
import { ViewToggle } from '../../shared/ui/view-toggle';
import { FlashCards } from './components/flash-cards/flash-cards';
import { FlashEditModal } from './components/flash-edit-modal/flash-edit-modal';
import { FlashDeleteModal } from './components/flash-delete-modal/flash-delete-modal';
import { FlashService } from './data/flash.service';
import { Flash, FLASH_STYLES, toFlash, toFlashJson } from './models/flash.model';

// Liste des flashs : filtres et tri côté serveur, recherche temporisée.

@Component({
  selector: 'app-flash',
  imports: [
    Button,
    Icon,
    PageHeader,
    FilterBar,
    Select,
    EmptyState,
    ListToolbar,
    ViewToggle,
    FlashCards,
    FlashEditModal,
    FlashDeleteModal,
  ],
  templateUrl: './flash.html',
})
export class FlashPage {
  private flashService = inject(FlashService);

  styles = FLASH_STYLES;

  search = signal('');
  private debouncedSearch = toSignal(
    toObservable(this.search).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  statusFilter = signal('');
  styleFilter = signal('');
  sort = signal<string>('recent');
  view = signal<'liste' | 'grille'>('grille');

  private filters = computed(() => ({
    search: this.debouncedSearch(),
    status: this.statusFilter(),
    style: this.styleFilter(),
    sort: this.sort(),
  }));

  private _flashs = signal<Flash[]>([]);
  private _loading = signal(true);
  private _error = signal(false);

  flashs = this._flashs.asReadonly();
  isLoading = this._loading.asReadonly();
  isError = this._error.asReadonly();
  available = computed(() => this._flashs().filter((f) => f.status === 'disponible').length);

  constructor() {

    toObservable(this.filters).subscribe((filtres) => this.charger(filtres));
  }

  private charger(filters = this.filters()) {
    this._loading.set(true);
    this._error.set(false);
    this.flashService
      .list(filters)
      .pipe(map((rows) => rows.map(toFlash)))
      .subscribe({
        next: (rows) => {
          this._flashs.set(rows);
          this._loading.set(false);
        },
        error: () => {
          this._error.set(true);
          this._loading.set(false);
        },
      });
  }

  reload = () => this.charger();

  createFlash() {
    this.editing.set({
      id: 0,
      name: '',
      imageUrl: '',
      price: 0,
      sizeCm: null,
      placement: '',
      style: '',
      status: 'disponible',
    });
  }

  editing = signal<Flash | null>(null);
  openEdit(f: Flash) {
    this.editing.set(f);
  }
  onSave(flash: Flash) {
    const requete =
      flash.id === 0
        ? this.flashService.create(toFlashJson(flash))
        : this.flashService.patch(flash.id, toFlashJson(flash));
    requete.subscribe(() => this.charger());
    this.editing.set(null);
  }

  deleting = signal<Flash | null>(null);
  requestDelete(f: Flash) {
    this.deleting.set(f);
  }
  onDelete(flash: Flash) {
    this.flashService.remove(flash.id).subscribe(() => this.charger());
    this.deleting.set(null);
  }
}
