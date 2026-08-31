// Contrat API du studio en snake_case.
export interface StudioJson {
  id: number;
  user_id: number;
  name: string;
  subtitle: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  siret: string | null;
  tva_mention: string | null;
  quote_prefix: string;
  invoice_prefix: string;
  payment_terms: string | null;
  deposit_terms: string | null;
  notify_rdv: number;
  notify_invoices: number;
}
