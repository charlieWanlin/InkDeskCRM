import { InvoiceJson, InvoiceItemJson, InvoiceStatutJson } from './invoice-json';

export type StatutFacture = 'Brouillon' | 'En attente' | 'Payée' | 'En retard';

export interface LigneFacture {
  id: number;
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Facture {
  id: number;
  numero: string;
  clientId: number;
  clientNom: string;
  initiales: string;
  projetId: number | null;
  projet: string;
  statut: StatutFacture;
  date: string;
  echeance: string;
  montant: number; // Total API utilisé en liste.
  lignes: LigneFacture[];
}

// TVA non applicable : le total HT sert aussi de TTC.

export function totalFacture(f: Facture): number {
  if (f.lignes.length) return f.lignes.reduce((t, l) => t + l.quantite * l.prixUnitaire, 0);
  return f.montant;
}

// Le statut « En retard » est dérivé ; le backend ne stocke que les états persistants.

function initiales(first?: string, last?: string): string {
  return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase();
}

function statutFactureFromJson(json: InvoiceJson): StatutFacture {
  if (json.status === 'payee') return 'Payée';
  if (json.status === 'annulee') return 'Brouillon';
  const today = new Date().toISOString().slice(0, 10);
  if (json.due_at && json.due_at < today) return 'En retard';
  return 'En attente';
}

// Le statut dérivé « En retard » est persisté comme « emise ».
function statutFactureToJson(statut: StatutFacture): InvoiceStatutJson {
  return statut === 'Payée' ? 'payee' : 'emise';
}

export function toLigneFacture(json: InvoiceItemJson): LigneFacture {
  return {
    id: json.id ?? 0,
    designation: json.label,
    quantite: Number(json.qty) || 0,
    prixUnitaire: Number(json.unit_price) || 0,
  };
}

export function toFacture(json: InvoiceJson): Facture {
  return {
    id: json.id,
    numero: json.number,
    clientId: json.client_id,
    clientNom: `${json.first_name ?? ''} ${json.last_name ?? ''}`.trim(),
    initiales: initiales(json.first_name, json.last_name),
    projetId: json.project_id ?? null,
    projet: json.project_title ?? '',
    statut: statutFactureFromJson(json),
    date: json.issued_at ?? '',
    echeance: json.due_at ?? '',
    montant: Number(json.total_ttc) || 0,
    lignes: (json.items ?? []).map(toLigneFacture),
  };
}

export function toInvoiceItemJson(l: LigneFacture): InvoiceItemJson {
  return { label: l.designation, qty: l.quantite, unit_price: l.prixUnitaire, tva_rate: 0 };
}

// Le backend recalcule les totaux.
export function toInvoiceJson(f: {
  clientId: number;
  projetId: number | null;
  statut: StatutFacture;
  echeance: string;
  lignes: LigneFacture[];
}): Partial<InvoiceJson> {
  return {
    client_id: f.clientId,
    project_id: f.projetId,
    status: statutFactureToJson(f.statut),
    due_at: f.echeance || null,
    items: f.lignes.map(toInvoiceItemJson),
  };
}
