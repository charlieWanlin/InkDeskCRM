import { ClientJson, ClientStatutJson } from './client-json';

// Modèle front en camelCase.
export type ClientStatut = ClientStatutJson;

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  birthdate: string;
  style: string;
  status: ClientStatut;
  allergies: string;
  healthNotes: string;
  notes: string;
  lastVisit: string;
  caTotal: number;
  createdAt: string;
}

export const CLIENT_STYLES = [
  'Blackwork',
  'Fine line',
  'Old school',
  'Realisme',
  'Ornemental',
  'Lettrage',
] as const;

export function toClient(json: ClientJson): Client {
  return {
    id: json.id,
    firstName: json.first_name,
    lastName: json.last_name,
    email: json.email ?? '',
    phone: json.phone ?? '',
    address: json.address ?? '',
    birthdate: json.birthdate ?? '',
    style: json.style ?? '',
    status: json.status,
    allergies: json.allergies ?? '',
    healthNotes: json.health_notes ?? '',
    notes: json.notes ?? '',
    lastVisit: json.last_visit ?? '',
    caTotal: Number(json.ca_total) || 0,
    createdAt: json.created_at ?? '',
  };
}

export type ClientEditable = Pick<
  Client,
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'address'
  | 'birthdate'
  | 'style'
  | 'status'
  | 'allergies'
  | 'healthNotes'
  | 'notes'
>;

export function toClientJson(client: ClientEditable): Partial<ClientJson> {
  return {
    first_name: client.firstName,
    last_name: client.lastName,
    email: client.email || null,
    phone: client.phone || null,
    address: client.address || null,
    birthdate: client.birthdate || null,
    style: client.style || null,
    status: client.status,
    allergies: client.allergies || null,
    health_notes: client.healthNotes || null,
    notes: client.notes || null,
  };
}
