import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { StudioLetterhead } from '../../core/studio/studio-letterhead';
import { Button } from '../../shared/button/button';
import { Icon } from '../../shared/ui/icon';
import { LigneDevis, toQuoteJson } from './models/devis.model';
import { QuoteService } from './data/quote.service';
import { ClientService } from '../clients/data/client.service';
import { toClient } from '../clients/models/client.model';
import { ProjectService } from '../projets/data/project.service';
import { toProjet } from '../projets/models/projet.model';

type LigneForm = FormGroup<{
  designation: FormControl<string>;
  quantite: FormControl<number>;
  prixUnitaire: FormControl<number>;
}>;

@Component({
  selector: 'app-devis-nouveau',
  imports: [ReactiveFormsModule, RouterLink, Button, Icon, StudioLetterhead],
  templateUrl: './devis-nouveau.html',
})
export class DevisNouveau {
  private fb = inject(FormBuilder);
  private service = inject(QuoteService);
  private clientService = inject(ClientService);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  private _clients = signal<ReturnType<typeof toClient>[]>([]);
  clients = this._clients.asReadonly();
  private _projets = signal<ReturnType<typeof toProjet>[]>([]);
  projets = this._projets.asReadonly();

  constructor() {
    this.clientService
      .list()
      .pipe(map((rows) => rows.map(toClient)))
      .subscribe((r) => this._clients.set(r));
    this.projectService
      .list()
      .pipe(map((rows) => rows.map(toProjet)))
      .subscribe((r) => this._projets.set(r));
  }

  form = this.fb.group({
    clientId: this.fb.control<number | null>(null, Validators.required),
    projetId: this.fb.control<number | null>(null),
    lignes: this.fb.array<LigneForm>([this.nouvelleLigne()]),
  });

  get lignes(): FormArray<LigneForm> {
    return this.form.controls.lignes;
  }

  private nouvelleLigne(l?: Partial<LigneDevis>): LigneForm {
    return this.fb.nonNullable.group({
      designation: [l?.designation ?? ''],
      quantite: [l?.quantite ?? 1],
      prixUnitaire: [l?.prixUnitaire ?? 0],
    });
  }

  private value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  clientNom = computed(() => {
    const c = this.clients().find((x) => x.id === this.value().clientId);
    return c ? `${c.firstName} ${c.lastName}`.trim() : '';
  });
  projetNom = computed(
    () => this.projets().find((p) => p.id === this.value().projetId)?.titre ?? '',
  );
  total = computed(() =>
    (this.value().lignes ?? []).reduce(
      (t, l) => t + (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0),
      0,
    ),
  );

  totalLigne(ligne: FormGroup): number {
    const v = ligne.getRawValue();
    return (Number(v.quantite) || 0) * (Number(v.prixUnitaire) || 0);
  }

  ajouterLigne() {
    this.lignes.push(this.nouvelleLigne());
  }

  supprimerLigne(index: number) {
    this.lignes.removeAt(index);
  }

  tentativeEnvoi = signal(false);

  private statut = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  clientManquant = computed(() => {
    this.statut();
    return this.tentativeEnvoi() && this.form.controls.clientId.invalid;
  });

  creer() {
    this.tentativeEnvoi.set(true);
    if (this.form.controls.clientId.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const lignesValides: LigneDevis[] = v.lignes
      .filter((l) => (l.designation ?? '').trim() !== '' || Number(l.prixUnitaire) > 0)
      .map((l, i) => ({
        id: i + 1,
        designation: l.designation ?? '',
        quantite: Number(l.quantite) || 0,
        prixUnitaire: Number(l.prixUnitaire) || 0,
      }));
    this.service
      .create(
        toQuoteJson({
          clientId: v.clientId!,
          projetId: v.projetId,
          statut: 'Brouillon',
          lignes: lignesValides,
        }),
      )
      .subscribe((devis) => this.router.navigate(['/devis', devis.id]));
  }
}
