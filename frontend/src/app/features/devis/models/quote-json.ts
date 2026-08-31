// Contrats API des devis en snake_case.

export type QuoteStatutJson = 'brouillon' | 'envoye' | 'accepte' | 'refuse';

export interface QuoteItemJson {
  id?: number;
  quote_id?: number;
  label: string;
  qty: string | number;
  unit_price: string | number;
  tva_rate?: string | number;
}

export interface QuoteJson {
  id: number;
  user_id?: number;
  client_id: number;
  project_id: number | null;
  number: string;
  status: QuoteStatutJson;
  total_ht?: string | number;
  total_tva?: string | number;
  total_ttc: string | number;
  valid_until: string | null;
  notes?: string | null;
  created_at: string;
  // Champs enrichis par jointure.
  first_name?: string;
  last_name?: string;
  project_title?: string | null;
  // Présent sur le détail devis.
  items?: QuoteItemJson[];
}
