// Contrats API des comptes en snake_case.

export interface ProfileJson {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  bio: string | null;
}

export interface UserJson {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  created_at: string;
}

export interface NewUserJson {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}
