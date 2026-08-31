import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  // Noms de marque (cohérence : le logiciel = InkDesk Software, le studio = L'encre de Lune).
  shopName = 'L’Encre de Lune';
  softwareName = 'InkDesk Software';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  erreur = signal('');
  chargement = signal(false);

  seConnecter() {
    this.erreur.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.chargement.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.erreur.set('Email ou mot de passe incorrect.');
        this.chargement.set(false);
      },
    });
  }
}
