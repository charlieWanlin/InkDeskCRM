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

type Periode = 'jour' | 'mois' | 'annee';

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

  periode = signal<Periode>('mois');
  periodes: { value: Periode; label: string }[] = [
    { value: 'jour', label: 'Jours' },
    { value: 'mois', label: 'Mois' },
    { value: 'annee', label: 'Années' },
  ];

  caParPeriode = computed(() => {
    const p = this.periode();
    const now = new Date();
    const buckets: { label: string; value: number }[] = [];
    const index: Record<string, number> = {};

    // Les périodes sans facture restent affichées dans le graphique.
    let keyOf: (f: Facture) => string;
    if (p === 'jour') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        index[key] = buckets.length;
        buckets.push({
          label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          value: 0,
        });
      }
      keyOf = (f) => f.date.slice(0, 10);
    } else if (p === 'annee') {
      for (let i = 4; i >= 0; i--) {
        const y = now.getFullYear() - i;
        index[String(y)] = buckets.length;
        buckets.push({ label: String(y), value: 0 });
      }
      keyOf = (f) => f.date.slice(0, 4);
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        index[key] = buckets.length;
        buckets.push({ label: d.toLocaleDateString('fr-FR', { month: 'short' }), value: 0 });
      }
      keyOf = (f) => f.date.slice(0, 7);
    }

    for (const f of this.factures()) {
      if (f.statut !== 'Payée') continue;
      const key = keyOf(f);
      if (key in index) buckets[index[key]].value += totalFacture(f);
    }
    return buckets;
  });
  caMax = computed(() => Math.max(1, ...this.caParPeriode().map((b) => b.value)));

  facturation = computed(() => {
    const f = this.factures();
    const somme = (statut: string) =>
      f.filter((x) => x.statut === statut).reduce((t, x) => t + totalFacture(x), 0);
    return [
      { label: 'Payées', value: somme('Payée'), color: '#16a34a' },
      { label: 'En attente', value: somme('En attente'), color: '#d97706' },
      { label: 'En retard', value: somme('En retard'), color: '#dc2626' },
    ];
  });
  facturationTotal = computed(() => this.facturation().reduce((t, s) => t + s.value, 0));
  donutGradient = computed(() => {
    const total = this.facturationTotal() || 1;
    let acc = 0;
    const parts = this.facturation().map((s) => {
      const debut = (acc / total) * 100;
      acc += s.value;
      const fin = (acc / total) * 100;
      return `${s.color} ${debut}% ${fin}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  });

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
