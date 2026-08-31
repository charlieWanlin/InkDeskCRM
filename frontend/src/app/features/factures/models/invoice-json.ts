// Contrats API des factures en snake_case.

export type InvoiceStatutJson = 'emise' | 'payee' | 'annulee';

export interface InvoiceItemJson {
  id?: number;
  invoice_id?: number;
  label: string;
  qty: string | number;
  unit_price: string | number;
  tva_rate?: string | number;
}

export interface InvoiceJson {
  id: number;
  user_id?: number;
  client_id: number;
  quote_id: number | null;
  project_id: number | null;
  number: string;
  status: InvoiceStatutJson;
  total_ht?: string | number;
  total_tva?: string | number;
  total_ttc: string | number;
  issued_at: string;
  due_at: string | null;
  paid_at: string | null;
  created_at?: string;
  // Champs enrichis par jointure.
  first_name?: string;
  last_name?: string;
  project_title?: string | null;
  // Présent sur le détail facture.
  items?: InvoiceItemJson[];
}
