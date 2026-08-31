import { Component, inject, input, signal, effect, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ClientService } from './data/client.service';
import { ClientJson } from './models/client-json';
import { ProjectService } from '../projets/data/project.service';
import { QuoteService } from '../devis/data/quote.service';
import { InvoiceService } from '../factures/data/invoice.service';
import { ProjectJson, ProjectStatutJson, SessionJson } from '../projets/models/project-json';
import { QuoteJson, QuoteStatutJson } from '../devis/models/quote-json';
import { InvoiceJson, InvoiceStatutJson } from '../factures/models/invoice-json';
import { ClientFormModal } from './components/client-form-modal/client-form-modal';
import { Button } from '../../shared/button/button';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import { Icon } from '../../shared/ui/icon';

interface ProjetVue {
  id: number;
  titre: string;
  detail: string;
  avancement: string;
  statut: string;
  montant: string;
}

interface DocVue {
  type: string;
  numero: string;
  objet: string;
  montant: string;
  statut: string;
  variant: string;
  lien: (string | number)[];
}

interface HistoVue {
  texte: string;
  date: string;
  lien: (string | number)[] | null;
  actif: boolean;
}

@Component({
  selector: 'app-client-detail',
  imports: [RouterLink, DatePipe, ClientFormModal, Button, StatusBadge, Icon],
  templateUrl: './client-detail.html',
})
export class ClientDetail {
  private clientService = inject(ClientService);
  private projectService = inject(ProjectService);
  private quoteService = inject(QuoteService);
  private invoiceService = inject(InvoiceService);

  id = input.required<string>();

  client = signal<ClientJson | null>(null);
  introuvable = signal(false);
  modalOuvert = signal(false);

  // Activité réelle du client, chargée depuis l'API (vide tant qu'il n'a rien).
  projets = signal<ProjetVue[]>([]);
  documents = signal<DocVue[]>([]);
  historique = signal<HistoVue[]>([]);

  // Indicateurs de tête, calculés à partir de l'activité réelle.
  caRegle = signal('0 €');
  nbSeances = signal('0');
  derniereVisite = signal('—');
  prochainRdv = signal('—');

  initiales = computed(() => {
    const c = this.client();
    return c ? c.first_name.charAt(0) + c.last_name.charAt(0) : '';
  });

  constructor() {
    effect(() => this.charger(Number(this.id())));
  }

  private charger(id: number) {
    this.introuvable.set(false);
    this.clientService.get(id).subscribe({
      next: (c) => {
        this.client.set(c);
        this.chargerActivite(c);
      },
      // 404 : la fiche n'existe pas, ou elle appartient a un autre utilisateur.
      error: () => {
        this.client.set(null);
        this.introuvable.set(true);
      },
    });
  }

  // Récupère projets, devis, factures et séances, puis ne garde que ceux de ce client.
  private chargerActivite(c: ClientJson) {
    forkJoin({
      projects: this.projectService.list(),
      quotes: this.quoteService.list(),
      invoices: this.invoiceService.list(),
      sessions: this.projectService.listSessions(),
    }).subscribe(({ projects, quotes, invoices, sessions }) => {
      const cid = c.id;
      const mesProjets = projects.filter((p) => p.client_id === cid);
      const mesDevis = quotes.filter((q) => q.client_id === cid);
      const mesFactures = invoices.filter((i) => i.client_id === cid);
      const idsProjets = mesProjets.map((p) => p.id);
      const mesSeances = sessions.filter(
        (s) => s.client_id === cid || idsProjets.includes(s.project_id),
      );

      this.projets.set(
        mesProjets.map((p) => ({
          id: p.id,
          titre: p.title,
          detail: [p.style, p.zone].filter(Boolean).join(' · ') || '—',
          avancement: this.labelProjet(p.status),
          statut: p.status,
          montant: this.euro(p.amount),
        })),
      );

      this.documents.set([
        ...mesDevis.map((q) => ({
          type: 'Devis',
          numero: q.number,
          objet: q.project_title ?? '—',
          montant: this.euro(q.total_ttc),
          statut: this.labelDevis(q.status),
          variant: this.variantDevis(q.status),
          lien: ['/devis', q.id],
        })),
        ...mesFactures.map((i) => ({
          type: 'Facture',
          numero: i.number,
          objet: i.project_title ?? '—',
          montant: this.euro(i.total_ttc),
          statut: this.labelFacture(i.status),
          variant: this.variantFacture(i.status),
          lien: ['/factures', i.id],
        })),
      ]);

      this.historique.set(this.construireHistorique(c, mesProjets, mesDevis, mesFactures));
      this.calculerIndicateurs(c, mesFactures, mesSeances);
    });
  }

  // CA réglé, nombre de séances, dernière visite et prochain rendez-vous.
  private calculerIndicateurs(c: ClientJson, factures: InvoiceJson[], seances: SessionJson[]) {
    const totalPaye = factures
      .filter((i) => i.status === 'payee')
      .reduce((somme, i) => somme + Number(i.total_ttc ?? 0), 0);
    this.caRegle.set(this.euro(totalPaye));

    const realisees = seances.filter((s) => s.status === 'realisee');
    this.nbSeances.set(String(realisees.length));

    this.derniereVisite.set(c.last_visit ? this.fmtCourt(c.last_visit) : '—');

    const maintenant = Date.now();
    const prochaine = seances
      .filter((s) => s.status === 'planifiee' && this.time(s.scheduled_at) >= maintenant)
      .sort((a, b) => this.time(a.scheduled_at) - this.time(b.scheduled_at))[0];
    this.prochainRdv.set(prochaine ? this.fmtRdv(prochaine.scheduled_at) : '—');
  }

  private construireHistorique(
    c: ClientJson,
    projets: ProjectJson[],
    devis: QuoteJson[],
    factures: InvoiceJson[],
  ): HistoVue[] {
    const events: (HistoVue & { ts: number })[] = [];

    for (const i of factures) {
      if (i.paid_at) {
        events.push({
          texte: `Facture réglée — ${this.euro(i.total_ttc)}`,
          date: this.fmt(i.paid_at),
          lien: ['/factures', i.id],
          actif: true,
          ts: this.time(i.paid_at),
        });
      } else {
        events.push({
          texte: `Facture émise — ${this.euro(i.total_ttc)}`,
          date: this.fmt(i.issued_at),
          lien: ['/factures', i.id],
          actif: false,
          ts: this.time(i.issued_at),
        });
      }
    }

    for (const q of devis) {
      events.push({
        texte: `Devis ${this.labelDevis(q.status).toLowerCase()} — ${this.euro(q.total_ttc)}`,
        date: this.fmt(q.created_at),
        lien: ['/devis', q.id],
        actif: false,
        ts: this.time(q.created_at),
      });
    }

    for (const p of projets) {
      events.push({
        texte: `Projet créé — ${p.title}`,
        date: this.fmt(p.created_at),
        lien: ['/projets', p.id],
        actif: false,
        ts: this.time(p.created_at),
      });
    }

    events.push({
      texte: 'Client créé',
      date: this.fmt(c.created_at ?? ''),
      lien: null,
      actif: false,
      ts: this.time(c.created_at ?? ''),
    });

    return events.sort((a, b) => b.ts - a.ts).map(({ ts: _ts, ...e }) => e);
  }

  onEnregistre() {
    const c = this.client();
    if (c) this.charger(c.id);
    this.modalOuvert.set(false);
  }

  age(birthdate: string | null): number | null {
    if (!birthdate) return null;
    const n = new Date(birthdate);
    return Math.floor((Date.now() - n.getTime()) / (365.25 * 24 * 3600 * 1000));
  }

  // --- Helpers de présentation ---

  private euro(montant: string | number | null | undefined): string {
    return `${Number(montant ?? 0).toLocaleString('fr-FR')} €`;
  }

  private fmt(date: string): string {
    if (!date) return '';
    const d = new Date(date.replace(' ', 'T'));
    return isNaN(d.getTime()) ? date : d.toLocaleDateString('fr-FR');
  }

  private fmtCourt(date: string): string {
    if (!date) return '—';
    const d = new Date(date.replace(' ', 'T'));
    return isNaN(d.getTime())
      ? date
      : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  private fmtRdv(date: string): string {
    if (!date) return '—';
    const d = new Date(date.replace(' ', 'T'));
    if (isNaN(d.getTime())) return date;
    const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const auj = new Date();
    const memeJour =
      d.getDate() === auj.getDate() &&
      d.getMonth() === auj.getMonth() &&
      d.getFullYear() === auj.getFullYear();
    return memeJour
      ? `Auj. ${heure}`
      : `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${heure}`;
  }

  private time(date: string): number {
    if (!date) return 0;
    const d = new Date(date.replace(' ', 'T'));
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  private labelProjet(statut: ProjectStatutJson): string {
    switch (statut) {
      case 'en_cours':
        return 'En cours';
      case 'termine':
        return 'Terminé';
      default:
        return 'En attente';
    }
  }

  statutProjetClasses(statut: string): string {
    switch (statut) {
      case 'en_cours':
        return 'bg-info-soft text-info';
      case 'termine':
        return 'bg-success-soft text-success';
      default:
        return 'bg-warning-soft text-warning';
    }
  }

  private labelDevis(statut: QuoteStatutJson): string {
    switch (statut) {
      case 'accepte':
        return 'Accepté';
      case 'refuse':
        return 'Refusé';
      case 'envoye':
        return 'Envoyé';
      default:
        return 'Brouillon';
    }
  }

  private variantDevis(statut: QuoteStatutJson): string {
    switch (statut) {
      case 'accepte':
        return 'success';
      case 'refuse':
        return 'danger';
      case 'envoye':
        return 'info';
      default:
        return 'default';
    }
  }

  private labelFacture(statut: InvoiceStatutJson): string {
    switch (statut) {
      case 'payee':
        return 'Payée';
      case 'annulee':
        return 'Annulée';
      default:
        return 'Émise';
    }
  }

  private variantFacture(statut: InvoiceStatutJson): string {
    switch (statut) {
      case 'payee':
        return 'success';
      case 'annulee':
        return 'danger';
      default:
        return 'warning';
    }
  }

  docBadge(variant: string): string {
    switch (variant) {
      case 'success':
        return 'bg-success-soft text-success';
      case 'warning':
        return 'bg-warning-soft text-warning';
      case 'danger':
        return 'bg-danger-soft text-danger';
      case 'info':
        return 'bg-info-soft text-info';
      default:
        return 'bg-surface-2 text-fg-muted';
    }
  }
}
