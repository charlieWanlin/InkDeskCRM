// Contrat API en snake_case.
export type FlashStatutJson = 'disponible' | 'reserve' | 'vendu';

export interface FlashJson {
  id: number;
  user_id?: number;
  name: string;
  image: string | null;
  price: string | number;
  size_cm: number | null;
  placement: string | null;
  style: string | null;
  status: FlashStatutJson;
  created_at?: string;
  updated_at?: string;
}
