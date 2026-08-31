import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { Button } from '../../shared/button/button';
import { Icon } from '../../shared/ui/icon';
import { Avatar } from '../../shared/ui/avatar';
import { PageHeader } from '../../shared/ui/page-header';
import { AccountService } from '../../core/account/account.service';
import { AuthService } from '../../core/auth/auth.service';
import { Membre, toMembre } from '../../core/account/models/account.model';

@Component({
  selector: 'app-utilisateurs',
  imports: [ReactiveFormsModule, Button, Icon, Avatar, PageHeader],
  templateUrl: './utilisateurs.html',
})
export class Utilisateurs {
  private service = inject(AccountService);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  // L'utilisateur connecté ne peut pas supprimer son propre compte.
  monId = computed(() => this.auth.user()?.id ?? 0);
  // Les actions de gestion sont réservées aux administrateurs.
  estAdmin = computed(() => this.auth.user()?.role === 'admin');

  private _membres = signal<Membre[]>([]);
  membres = this._membres.asReadonly();

  constructor() {
    this.chargerMembres();
  }

  private chargerMembres() {
    this.service
      .users()
      .pipe(map((rows) => rows.map(toMembre)))
      .subscribe((r) => this._membres.set(r));
  }

  modalOuverte = signal(false);
  serverError = signal('');

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['artiste'],
  });

  ouvrirModal() {
    this.form.reset({ name: '', email: '', password: '', role: 'artiste' });
    this.serverError.set('');
    this.modalOuverte.set(true);
  }
  fermerModal() {
    this.modalOuverte.set(false);
  }

  error(name: string): string | null {
    const c = this.form.get(name);
    if (!c || c.valid || !c.touched) return null;
    if (c.hasError('required')) return 'Ce champ est obligatoire.';
    if (c.hasError('email')) return 'E-mail invalide.';
    if (c.hasError('minlength')) return 'Au moins 6 caractères.';
    return null;
  }

  inviter() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.serverError.set('');
    this.service.createUser(this.form.getRawValue()).subscribe({
      next: () => {
        this.chargerMembres();
        this.modalOuverte.set(false);
      },
      error: (e) => {
        this.serverError.set(e?.error?.error ?? 'Impossible de créer le membre.');
      },
    });
  }

  aSupprimer = signal<Membre | null>(null);
  demanderSuppression(m: Membre) {
    this.aSupprimer.set(m);
  }
  confirmerSuppression() {
    const m = this.aSupprimer();
    if (m) {
      this.service.deleteUser(m.id).subscribe(() => this.chargerMembres());
    }
    this.aSupprimer.set(null);
  }

  roleClass(role: string): string {
    if (role === 'Propriétaire') return 'bg-primary-soft text-primary';
    if (role === 'Tatoueur') return 'bg-info-soft text-info';
    return 'bg-surface-2 text-fg-muted';
  }
}
