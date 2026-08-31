import { Service, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  user: AuthUser;
}

const USER_KEY = 'user';

// Authentification : le jeton vit dans un cookie httpOnly, jamais exposé au JavaScript.
@Service()
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = environment.apiUrl;

  private _user = signal<AuthUser | null>(this.readUser());
  user = this._user.asReadonly();
  isLoggedIn = computed(() => this._user() !== null);

  // Connexion : on envoie l'email et le mot de passe, le serveur renvoie un jeton dans un cookie httpOnly.
  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${this.base}/auth/login`, { email, password })
      .pipe(tap((res) => this.setUser(res.user)));
  }



  logout() {

    this.http.post(`${this.base}/auth/logout`, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  clearSession() {
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private setUser(user: AuthUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }
}
