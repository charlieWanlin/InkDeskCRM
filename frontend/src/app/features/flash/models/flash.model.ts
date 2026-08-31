import { FlashJson, FlashStatutJson } from './flash-json';

// Modèle front en camelCase.
export type FlashStatut = FlashStatutJson;

export interface Flash {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  sizeCm: number | null;
  placement: string;
  style: string;
  status: FlashStatut;
}

export const FLASH_STYLES = [
  'Blackwork',
  'Fine line',
  'Old school',
  'Realisme',
  'Ornemental',
  'Lettrage',
] as const;

export const FLASH_STATUTS: { value: FlashStatut; label: string }[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'reserve', label: 'Réservé' },
  { value: 'vendu', label: 'Vendu' },
];

const FLASH_LABELS: Record<FlashStatut, string> = {
  disponible: 'Disponible',
  reserve: 'Réservé',
  vendu: 'Vendu',
};

export function flashStatutLabel(s: FlashStatut): string {
  return FLASH_LABELS[s];
}

export function flashStatutClass(s: FlashStatut): string {
  switch (s) {
    case 'disponible':
      return 'bg-success-soft text-success';
    case 'reserve':
      return 'bg-warning-soft text-warning';
    case 'vendu':
      return 'bg-danger-soft text-danger';
    default:
      return 'bg-surface-2 text-fg-muted';
  }
}

export function toFlash(json: FlashJson): Flash {
  return {
    id: json.id,
    name: json.name,
    imageUrl: json.image ?? '',
    price: Number(json.price) || 0,
    sizeCm: json.size_cm ?? null,
    placement: json.placement ?? '',
    style: json.style ?? '',
    status: json.status,
  };
}

export function toFlashJson(flash: Flash): Partial<FlashJson> {
  return {
    name: flash.name,
    image: flash.imageUrl || null,
    price: flash.price,
    size_cm: flash.sizeCm,
    placement: flash.placement || null,
    style: flash.style || null,
    status: flash.status,
  };
}
