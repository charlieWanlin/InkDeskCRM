import { StudioJson } from './studio-json';

// Modèle front des réglages du studio.
export interface Studio {
  id: number;
  name: string;
  subtitle: string;
  email: string;
  phone: string;
  address: string;
  siret: string;
  tvaMention: string;
  quotePrefix: string;
  invoicePrefix: string;
  paymentTerms: string;
  depositTerms: string;
  notifyRdv: boolean;
  notifyInvoices: boolean;
}

export function toStudio(json: StudioJson): Studio {
  return {
    id: json.id,
    name: json.name,
    subtitle: json.subtitle ?? '',
    email: json.email ?? '',
    phone: json.phone ?? '',
    address: json.address ?? '',
    siret: json.siret ?? '',
    tvaMention: json.tva_mention ?? '',
    quotePrefix: json.quote_prefix,
    invoicePrefix: json.invoice_prefix,
    paymentTerms: json.payment_terms ?? '',
    depositTerms: json.deposit_terms ?? '',
    notifyRdv: !!json.notify_rdv,
    notifyInvoices: !!json.notify_invoices,
  };
}

export function toStudioJson(s: Studio): Partial<StudioJson> {
  return {
    name: s.name,
    subtitle: s.subtitle,
    email: s.email,
    phone: s.phone,
    address: s.address,
    siret: s.siret,
    tva_mention: s.tvaMention,
    quote_prefix: s.quotePrefix,
    invoice_prefix: s.invoicePrefix,
    payment_terms: s.paymentTerms,
    deposit_terms: s.depositTerms,
    notify_rdv: s.notifyRdv ? 1 : 0,
    notify_invoices: s.notifyInvoices ? 1 : 0,
  };
}
