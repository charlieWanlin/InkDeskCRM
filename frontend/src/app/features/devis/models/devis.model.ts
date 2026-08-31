import { QuoteJson, QuoteItemJson, QuoteStatutJson } from './quote-json';

export type StatutDevis = 'Brouillon' | 'Envoyé' | 'Accepté' | 'Refusé';

export interface LigneDevis {
  id: number;
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Devis {
  id: number;
  numero: string;
  clientId: number;
  clientNom: string;
  initiales: string;
  projetId: number | null;
  projet: string;
  statut: StatutDevis;
  date: string;
  montant: number; // Total API utilisé sans lignes chargées.
  lignes: LigneDevis[];
}

// TVA non applicable : le total HT sert aussi de TTC.

export function totalDevis(d: Devis): number {
  if (d.lignes.length) return d.lignes.reduce((t, l) => t + l.quantite * l.prixUnitaire, 0);
  return d.montant;
}

const STATUT_FR: Record<QuoteStatutJson, StatutDevis> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
};
const STATUT_JSON: Record<StatutDevis, QuoteStatutJson> = {
  Brouillon: 'brouillon',
  Envoyé: 'envoye',
  Accepté: 'accepte',
  Refusé: 'refuse',
};

function initiales(first?: string, last?: string): string {
  return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase();
}

export function toLigneDevis(json: QuoteItemJson): LigneDevis {
  return {
    id: json.id ?? 0,
    designation: json.label,
    quantite: Number(json.qty) || 0,
    prixUnitaire: Number(json.unit_price) || 0,
  };
}

export function toDevis(json: QuoteJson): Devis {
  return {
    id: json.id,
    numero: json.number,
    clientId: json.client_id,
    clientNom: `${json.first_name ?? ''} ${json.last_name ?? ''}`.trim(),
    initiales: initiales(json.first_name, json.last_name),
    projetId: json.project_id ?? null,
    projet: json.project_title ?? '',
    statut: STATUT_FR[json.status],
    date: (json.created_at ?? '').split(' ')[0],
    montant: Number(json.total_ttc) || 0,
    lignes: (json.items ?? []).map(toLigneDevis),
  };
}

export function toQuoteItemJson(l: LigneDevis): QuoteItemJson {
  return { label: l.designation, qty: l.quantite, unit_price: l.prixUnitaire, tva_rate: 0 };
}

// Le backend recalcule les totaux.
export function toQuoteJson(d: {
  clientId: number;
  projetId: number | null;
  statut: StatutDevis;
  lignes: LigneDevis[];
}): Partial<QuoteJson> {
  return {
    client_id: d.clientId,
    project_id: d.projetId,
    status: STATUT_JSON[d.statut],
    items: d.lignes.map(toQuoteItemJson),
  };
}
