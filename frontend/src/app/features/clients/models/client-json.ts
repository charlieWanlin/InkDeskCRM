// Contrat API en snake_case.
export type ClientStatutJson = 'prospect' | 'actif' | 'inactif';

export interface ClientJson {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  birthdate: string | null;
  style: string | null;
  status: ClientStatutJson;
  allergies: string | null;
  health_notes: string | null;
  notes: string | null;
  last_visit?: string | null;
  ca_total?: string | number | null;
  created_at?: string;
}
