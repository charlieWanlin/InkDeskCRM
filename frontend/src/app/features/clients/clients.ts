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
import { ClientCards } from './components/client-cards/client-cards';
import { ClientFormModal } from './components/client-form-modal/client-form-modal';
import { ClientDeleteModal } from './components/client-delete-modal/client-delete-modal';
import { ClientService } from './data/client.service';
import { Client, CLIENT_STYLES, toClient } from './models/client.model';

// Liste des clients : filtres et tri côté serveur, recherche temporisée.

@Component({
  selector: 'app-clients',
  imports: [
    Button,
    Icon,
    PageHeader,
    FilterBar,
    Select,
    EmptyState,
    ListToolbar,
    ViewToggle,
    ClientCards,
    ClientFormModal,
    ClientDeleteModal,
  ],
  templateUrl: './clients.html',
})
export class Clients {
  private clientService = inject(ClientService);

  styles = CLIENT_STYLES;

  search = signal('');
  private debouncedSearch = toSignal(
    toObservable(this.search).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  statusFilter = signal('');
  styleFilter = signal('');
  sort = signal<string>('recent');
  view = signal<'liste' | 'grille'>('liste');

  private filters = computed(() => ({
    search: this.debouncedSearch(),
    status: this.statusFilter(),
    style: this.styleFilter(),
    sort: this.sort(),
  }));

  private _clients = signal<Client[]>([]);
  private _loading = signal(true);
  private _error = signal(false);

  clients = this._clients.asReadonly();
  displayedClients = this._clients.asReadonly();
  isLoading = this._loading.asReadonly();
  isError = this._error.asReadonly();

  newThisMonth = computed(() => {
    const d = new Date();
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return this._clients().filter((c) => c.createdAt?.startsWith(month)).length;
  });

  constructor() {

    toObservable(this.filters).subscribe((filtres) => this.charger(filtres));
  }

  private charger(filters = this.filters()) {
    this._loading.set(true);
    this._error.set(false);
    this.clientService
      .list(filters)
      .pipe(map((rows) => rows.map(toClient)))
      .subscribe({
        next: (rows) => {
          this._clients.set(rows);
          this._loading.set(false);
        },
        error: () => {
          this._error.set(true);
          this._loading.set(false);
        },
      });
  }

  reload = () => this.charger();

  formModalOpen = signal(false);
  editingClient = signal<Client | null>(null);
  openCreate() {
    this.editingClient.set(null);
    this.formModalOpen.set(true);
  }
  openEdit(c: Client) {
    this.editingClient.set(c);
    this.formModalOpen.set(true);
  }
  closeModal() {
    this.formModalOpen.set(false);
    this.editingClient.set(null);
  }
  onSaved() {
    this.charger();
    this.closeModal();
  }

  deleting = signal<Client | null>(null);
  requestDelete(c: Client) {
    this.deleting.set(c);
  }
  onDelete(c: Client) {
    this.clientService.remove(c.id).subscribe(() => this.charger());
    this.deleting.set(null);
  }
}
