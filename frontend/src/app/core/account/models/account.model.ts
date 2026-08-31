import { ProfileJson, UserJson } from './account-json';

// Modèle front du profil utilisateur.
export interface Profil {
  id: number;
  nom: string;
  email: string;
  role: string;
  telephone: string;
  bio: string;
}

export interface Membre {
  id: number;
  nom: string;
  initiales: string;
  email: string;
  role: string;
  actif: boolean;
}

// Conversion du rôle API en libellé affichable.
function roleFr(role: string): string {
  return role === 'admin' ? 'Propriétaire' : 'Tatoueur';
}

function initiales(nom: string): string {
  return nom
    .split(' ')
    .map((m) => m[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function toProfil(json: ProfileJson): Profil {
  return {
    id: json.id,
    nom: json.name,
    email: json.email,
    role: roleFr(json.role),
    telephone: json.phone ?? '',
    bio: json.bio ?? '',
  };
}

export function toProfileJson(p: {
  nom: string;
  email: string;
  telephone: string;
  bio: string;
}): Partial<ProfileJson> {
  return { name: p.nom, email: p.email, phone: p.telephone, bio: p.bio };
}

export function toMembre(json: UserJson): Membre {
  return {
    id: json.id,
    nom: json.name,
    initiales: initiales(json.name),
    email: json.email,
    role: roleFr(json.role),
    actif: true,
  };
}
