import { Component, computed, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { Button } from '../../shared/button/button';
import { Avatar } from '../../shared/ui/avatar';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { AccountService } from '../../core/account/account.service';
import { toProfil, toProfileJson } from '../../core/account/models/account.model';
import { StudioService } from '../../core/studio/studio.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-profil',
  imports: [ReactiveFormsModule, Button, Avatar, Icon, PageHeader],
  templateUrl: './profil.html',
})
export class Profil {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private studioService = inject(StudioService);
  private auth = inject(AuthService);

  form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: [''],
    bio: [''],
  });

  private _profil = signal<ReturnType<typeof toProfil> | undefined>(undefined);
  profil = this._profil.asReadonly();

  private chargerProfil() {
    this.accountService
      .profile()
      .pipe(map(toProfil))
      .subscribe((p) => this._profil.set(p));
  }

  role = computed(() => this.profil()?.role ?? '');

  studio = computed(() => {
    const s = this.studioService.studio();
    return s ? [s.name, s.subtitle].filter(Boolean).join(' / ') : '';
  });

  constructor() {

    this.chargerProfil();

    effect(() => {
      const profil = this.profil();
      if (!profil) return;
      this.form.patchValue({
        nom: profil.nom,
        email: profil.email,
        telephone: profil.telephone,
        bio: profil.bio,
      });
    });
  }

  nom(): string {
    return this.form.controls.nom.value;
  }

  initiales(): string {
    return this.nom()
      .split(' ')
      .map((m) => m[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  error(name: string): string | null {
    const c = this.form.get(name);
    if (!c || c.valid || !c.touched) return null;
    if (c.hasError('required')) return 'Ce champ est obligatoire.';
    if (c.hasError('email')) return 'E-mail invalide.';
    return null;
  }

  enregistrer() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { nom, email, telephone, bio } = this.form.getRawValue();
    this.accountService
      .updateProfile(toProfileJson({ nom, email, telephone, bio }))
      .subscribe(() => this.chargerProfil());
  }

  seDeconnecter() {
    this.auth.logout();
  }
}
