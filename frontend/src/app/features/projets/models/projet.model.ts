import {
  ProjectJson,
  SessionJson,
  PhotoJson,
  ProjectStatutJson,
  SessionStatutJson,
} from './project-json';

export type StatutProjet = 'En attente' | 'En cours' | 'Terminé';
export type StatutSeance = 'Planifiée' | 'Réalisée' | 'Annulée';

// Valeurs de référence utilisées par les formulaires.
export const PROJET_STYLES = [
  'Blackwork',
  'Fine line',
  'Old school',
  'Réalisme',
  'Ornemental',
  'Lettrage',
] as const;

export const STATUTS_PROJET: StatutProjet[] = ['En attente', 'En cours', 'Terminé'];
export const STATUTS_SEANCE: StatutSeance[] = ['Planifiée', 'Réalisée', 'Annulée'];

export interface Photo {
  id: number;
  url: string; // URL de données ou chemin de ressource.
  legende?: string;
}

export interface Seance {
  id: number;
  titre: string;
  date: string; // Format YYYY-MM-DD.
  heure?: string;
  statut: StatutSeance;
  notes?: string;
  photos: Photo[];
}

export interface Projet {
  id: number;
  titre: string;
  clientId: number;
  clientNom: string;
  initiales: string;
  style: string;
  zone: string;
  statut: StatutProjet;
  montant: number;
  seancesPrevues: number;
  seances: Seance[];
  photos: Photo[]; // Références hors séances.
  flashId?: number;
  dateCreation: string;
}

export function seancesActives(p: Projet): Seance[] {
  return p.seances.filter((s) => s.statut !== 'Annulée');
}

export function totalSeances(p: Projet): number {
  return seancesActives(p).length;
}

export function seancesFaites(p: Projet): number {
  return p.seances.filter((s) => s.statut === 'Réalisée').length;
}

export function avancement(p: Projet): number {
  if (p.statut === 'Terminé') return 100;
  const total = totalSeances(p);
  if (total === 0) return 0;
  return Math.round((seancesFaites(p) / total) * 100);
}

export function toutesPhotos(p: Projet): Photo[] {
  return [...p.photos, ...p.seances.flatMap((s) => s.photos)];
}

const PROJET_STATUT_FR: Record<ProjectStatutJson, StatutProjet> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  termine: 'Terminé',
};
const PROJET_STATUT_JSON: Record<StatutProjet, ProjectStatutJson> = {
  'En attente': 'en_attente',
  'En cours': 'en_cours',
  Terminé: 'termine',
};
const SEANCE_STATUT_FR: Record<SessionStatutJson, StatutSeance> = {
  planifiee: 'Planifiée',
  realisee: 'Réalisée',
  annulee: 'Annulée',
};
const SEANCE_STATUT_JSON: Record<StatutSeance, SessionStatutJson> = {
  Planifiée: 'planifiee',
  Réalisée: 'realisee',
  Annulée: 'annulee',
};

function initiales(first?: string, last?: string): string {
  return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase();
}

export function toPhoto(json: PhotoJson): Photo {
  return { id: json.id, url: json.url, legende: json.caption ?? '' };
}

// Le champ API scheduled_at est scindé en date et heure locales.
export function toSeance(json: SessionJson): Seance {
  const [date, heure] = (json.scheduled_at ?? '').split(' ');
  return {
    id: json.id,
    titre: json.title,
    date: date ?? '',
    heure: heure ? heure.slice(0, 5) : '',
    statut: SEANCE_STATUT_FR[json.status],
    notes: json.notes ?? '',
    photos: [],
  };
}

// Séance enrichie pour le calendrier des rendez-vous.
export interface RdvItem {
  projetId: number;
  projetTitre: string;
  clientId: number;
  clientNom: string;
  initiales: string;
  seance: Seance;
}

export function toRdvItem(json: SessionJson): RdvItem {
  return {
    projetId: json.project_id,
    projetTitre: json.project_title ?? '',
    clientId: json.client_id ?? 0,
    clientNom: `${json.first_name ?? ''} ${json.last_name ?? ''}`.trim(),
    initiales: initiales(json.first_name, json.last_name),
    seance: toSeance(json),
  };
}

export function toProjet(json: ProjectJson): Projet {
  const photos = (json.photos ?? []).filter((p) => !p.session_id).map(toPhoto);
  const seances = (json.sessions ?? []).map((s) => {
    const seance = toSeance(s);
    seance.photos = (json.photos ?? []).filter((p) => p.session_id === s.id).map(toPhoto);
    return seance;
  });
  return {
    id: json.id,
    titre: json.title,
    clientId: json.client_id,
    clientNom: `${json.first_name ?? ''} ${json.last_name ?? ''}`.trim(),
    initiales: initiales(json.first_name, json.last_name),
    style: json.style ?? '',
    zone: json.zone ?? '',
    statut: PROJET_STATUT_FR[json.status],
    montant: Number(json.amount) || 0,
    seancesPrevues: json.planned_sessions,
    seances,
    photos,
    flashId: json.flash_id ?? undefined,
    dateCreation: (json.created_at ?? '').split(' ')[0],
  };
}

export function toProjectJson(form: {
  clientId: number;
  titre: string;
  style: string;
  zone: string;
  statut: StatutProjet;
  montant: number;
  seancesPrevues: number;
}): Partial<ProjectJson> {
  return {
    client_id: form.clientId,
    title: form.titre,
    style: form.style || null,
    zone: form.zone || null,
    status: PROJET_STATUT_JSON[form.statut],
    amount: form.montant,
    planned_sessions: form.seancesPrevues,
  };
}

// L'API attend scheduled_at au format "YYYY-MM-DD HH:mm:ss".
export function toSessionJson(form: {
  projetId: number;
  titre: string;
  date: string;
  heure: string;
  statut: StatutSeance;
  notes: string;
}): Partial<SessionJson> {
  const heure = form.heure || '00:00';
  return {
    project_id: form.projetId,
    title: form.titre,
    scheduled_at: `${form.date} ${heure}:00`,
    status: SEANCE_STATUT_JSON[form.statut],
    notes: form.notes || null,
  };
}
