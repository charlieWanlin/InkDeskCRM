import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Button } from '../../../../shared/button/button';
import { Icon } from '../../../../shared/ui/icon';
import { ProjectService } from '../../data/project.service';
import { Projet, Seance, StatutSeance, STATUTS_SEANCE, toProjet } from '../../models/projet.model';

// Charge utile d'une séance enregistrée.
export interface RdvFormData {
  projetId: number;
  seanceId: number | null;
  titre: string;
  date: string;
  heure: string;
  statut: StatutSeance;
  notes: string;
}

@Component({
  selector: 'app-rdv-form-modal',
  host: { '(document:keydown.escape)': 'fermer.emit()' },
  imports: [ReactiveFormsModule, RouterLink, Button, Icon],
  templateUrl: './rdv-form-modal.html',
})
export class RdvFormModal {
  private fb = inject(FormBuilder);
  private service = inject(ProjectService);

  seance = input<Seance | null>(null);
  projetId = input<number | null>(null);
  dateInitiale = input<string | null>(null);
  verrouille = input(false);
  enregistrer = output<RdvFormData>();
  supprimer = output<RdvFormData>();
  fermer = output<void>();

  statuts = STATUTS_SEANCE;

  private _projets = signal<Projet[]>([]);
  projets = this._projets.asReadonly();

  form = this.fb.nonNullable.group({
    projetId: [0, [Validators.required, Validators.min(1)]],
    titre: [''],
    date: ['', Validators.required],
    heure: ['14:00'],
    statut: ['Planifiée' as StatutSeance],
    notes: [''],
  });

  estEdition = computed(() => this.seance() !== null);
  private projetIdSelectionne = toSignal(this.form.controls.projetId.valueChanges, {
    initialValue: this.form.controls.projetId.value,
  });
  // Projet courant utilisé pour afficher le client associé.
  projetCourant = computed(
    () => this.projets().find((p) => p.id === Number(this.projetIdSelectionne())) ?? null,
  );

  erreur = signal('');

  constructor() {

    this.service
      .list()
      .pipe(map((rows) => rows.map(toProjet)))
      .subscribe((r) => this._projets.set(r));

    effect(() => {
      const s = this.seance();
      const pid = this.projetId();
      if (s) {
        const courant = Number(this.form.controls.projetId.value) || 0;
        this.form.reset({
          projetId: pid ?? courant,
          titre: s.titre,
          date: s.date,
          heure: s.heure ?? '14:00',
          statut: s.statut,
          notes: s.notes ?? '',
        });
      } else {
        const projet = pid ?? this.projets()[0]?.id ?? 0;
        const nb = this.projets().find((p) => p.id === projet)?.seances.length ?? 0;
        this.form.reset({
          projetId: projet,
          titre: 'Séance ' + (nb + 1),
          date: this.dateInitiale() ?? new Date().toISOString().slice(0, 10),
          heure: '14:00',
          statut: 'Planifiée',
          notes: '',
        });
      }
      this.erreur.set('');
    });
  }

  valider() {
    this.form.markAllAsTouched();
    const form = this.form.getRawValue();
    if (!Number(form.projetId)) {
      this.erreur.set('Choisissez un projet.');
      return;
    }
    if (!form.date) {
      this.erreur.set('Choisissez une date.');
      return;
    }
    if (this.form.invalid) return;
    this.erreur.set('');
    this.enregistrer.emit(this.payload());
  }

  demanderSuppression() {
    this.supprimer.emit(this.payload());
  }

  private payload(): RdvFormData {
    const form = this.form.getRawValue();
    return {
      projetId: Number(form.projetId),
      seanceId: this.seance()?.id ?? null,
      titre: form.titre.trim() || 'Séance',
      date: form.date,
      heure: form.heure,
      statut: form.statut,
      notes: form.notes.trim(),
    };
  }
}
