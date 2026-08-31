// Contrats API en snake_case.

export type ProjectStatutJson = 'en_attente' | 'en_cours' | 'termine';
export type SessionStatutJson = 'planifiee' | 'realisee' | 'annulee';

export interface PhotoJson {
  id: number;
  project_id: number;
  session_id: number | null;
  url: string;
  caption: string | null;
  created_at?: string;
}

export interface SessionJson {
  id: number;
  user_id?: number;
  project_id: number;
  title: string;
  scheduled_at: string; // Format "YYYY-MM-DD HH:mm:ss".
  status: SessionStatutJson;
  notes: string | null;
  // Champs présents dans les réponses enrichies du calendrier.
  project_title?: string;
  client_id?: number;
  first_name?: string;
  last_name?: string;
}

export interface ProjectJson {
  id: number;
  user_id?: number;
  client_id: number;
  flash_id: number | null;
  title: string;
  style: string | null;
  zone: string | null;
  status: ProjectStatutJson;
  amount: string | number;
  planned_sessions: number;
  created_at: string;
  // Champs enrichis par jointure.
  first_name?: string;
  last_name?: string;
  // Présents sur le détail projet.
  sessions?: SessionJson[];
  photos?: PhotoJson[];
}
