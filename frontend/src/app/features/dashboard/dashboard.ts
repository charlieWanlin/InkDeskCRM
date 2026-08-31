import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Icon } from '../../shared/ui/icon';
import { Avatar } from '../../shared/ui/avatar';
import { PageHeader } from '../../shared/ui/page-header';
import { ProjectService } from '../projets/data/project.service';
import { Projet, RdvItem, toProjet, toRdvItem } from '../projets/models/projet.model';
import { QuoteService } from '../devis/data/quote.service';
import { Devis, toDevis, totalDevis } from '../devis/models/devis.model';
import { InvoiceService } from '../factures/data/invoice.service';
import { Facture, toFacture, totalFacture } from '../factures/models/facture.model';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe, RouterLink, Icon, Avatar, PageHeader],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private projectService = inject(ProjectService);
  private quoteService = inject(QuoteService);
  private invoiceService = inject(InvoiceService);

  private projets = signal<Projet[]>([]);
  private rdvItems = signal<RdvItem[]>([]);
  private devis = signal<Devis[]>([]);
  private factures = signal<Facture[]>([]);

  constructor() {
    this.projectService
      .list()
      .pipe(map((rows) => rows.map(toProjet)))
      .subscribe((r) => this.projets.set(r));
    this.projectService
      .listSessions()
      .pipe(map((rows) => rows.map(toRdvItem)))
      .subscribe((r) => this.rdvItems.set(r));
    this.quoteService
      .list()
      .pipe(map((rows) => rows.map(toDevis)))
      .subscribe((r) => this.devis.set(r));
    this.invoiceService
      .list()
      .pipe(map((rows) => rows.map(toFacture)))
      .subscribe((r) => this.factures.set(r));
  }

  private aujourdhui = new Date().toISOString().slice(0, 10);

  caEncaisse = computed(() =>
    this.factures()
      .filter((f) => f.statut === 'Payée')
      .reduce((t, f) => t + totalFacture(f), 0),
  );
  caEnAttente = computed(() =>
    this.factures()
      .filter((f) => f.statut === 'En attente' || f.statut === 'En retard')
      .reduce((t, f) => t + totalFacture(f), 0),
  );
  projetsEnCours = computed(() => this.projets().filter((p) => p.statut === 'En cours').length);
  rdvAVenir = computed(
    () =>
      this.rdvItems().filter(
        (r) => r.seance.date >= this.aujourdhui && r.seance.statut !== 'Annulée',
      ).length,
  );

  prochainsRdv = computed(() => {
    return this.rdvItems()
      .filter((r) => r.seance.date >= this.aujourdhui && r.seance.statut !== 'Annulée')
      .sort((a, b) =>
        (a.seance.date + (a.seance.heure ?? '')).localeCompare(
          b.seance.date + (b.seance.heure ?? ''),
        ),
      )
      .slice(0, 4);
  });

  activite = computed(() => {
    const d = this.devis().map((x) => ({
      type: 'devis' as const,
      id: x.id,
      numero: x.numero,
      statut: x.statut,
      montant: totalDevis(x),
      date: x.date,
    }));
    const f = this.factures().map((x) => ({
      type: 'facture' as const,
      id: x.id,
      numero: x.numero,
      statut: x.statut,
      montant: totalFacture(x),
      date: x.date,
    }));
    return [...d, ...f].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  });

  statutClass(statut: string): string {
    if (statut === 'Accepté' || statut === 'Payée') return 'bg-success-soft text-success';
    if (statut === 'Refusé' || statut === 'En retard') return 'bg-danger-soft text-danger';
    if (statut === 'Envoyé' || statut === 'En attente') return 'bg-warning-soft text-warning';
    return 'bg-surface-2 text-fg-muted';
  }
}
