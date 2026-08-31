import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { Button } from '../../../../shared/button/button';
import { Icon } from '../../../../shared/ui/icon';
import { Avatar } from '../../../../shared/ui/avatar';
import { ClientPicker } from '../../../../shared/ui/client-picker';
import { ClientMini } from '../../../../shared/data/clients-repo';
import { ClientService } from '../../../clients/data/client.service';
import { toClient } from '../../../clients/models/client.model';
import { Projet, PROJET_STYLES, STATUTS_PROJET, StatutProjet } from '../../models/projet.model';

// Charge utile commune à la création et à l'édition.
export interface ProjetFormData {
  titre: string;
  clientId: number;
  clientNom: string;
  initiales: string;
  style: string;
  zone: string;
  statut: StatutProjet;
  montant: number;
  seancesPrevues: number;
}

@Component({
  selector: 'app-projet-form-modal',
  host: { '(document:keydown.escape)': 'fermer.emit()' },
  imports: [ReactiveFormsModule, Button, Icon, Avatar, ClientPicker],
  templateUrl: './projet-form-modal.html',
})
export class ProjetFormModal {
  private fb = inject(FormBuilder);

  projet = input<Projet | null>(null);
  clientImpose = input<ClientMini | null>(null);
  enregistrer = output<ProjetFormData>();
  fermer = output<void>();

  styles = PROJET_STYLES;
  statuts = STATUTS_PROJET;

  private clientService = inject(ClientService);
  private _clients = signal<ClientMini[]>([]);
  clients = this._clients.asReadonly();

  client = signal<ClientMini | null>(null);
  pickerOuvert = signal(false);

  form = this.fb.nonNullable.group({
    titre: ['', Validators.required],
    style: ['Blackwork'],
    zone: [''],
    statut: ['En attente' as StatutProjet],
    montant: [0, Validators.min(0)],
    seancesPrevues: [1, Validators.min(1)],
  });

  erreur = signal('');
  estEdition = computed(() => this.projet() !== null);

  constructor() {

    this.clientService
      .list()
      .pipe(
        map((rows) =>
          rows.map(toClient).map((c) => ({
            id: c.id,
            nom: `${c.firstName} ${c.lastName}`.trim(),
            initiales: ((c.firstName[0] ?? '') + (c.lastName[0] ?? '')).toUpperCase(),
          })),
        ),
      )
      .subscribe((r) => this._clients.set(r));

    effect(() => {
      const p = this.projet();
      if (p) {
        this.client.set({ id: p.clientId, nom: p.clientNom, initiales: p.initiales });
        this.form.reset({
          titre: p.titre,
          style: p.style,
          zone: p.zone,
          statut: p.statut,
          montant: p.montant,
          seancesPrevues: p.seancesPrevues,
        });
      } else {
        const c = this.clientImpose();
        this.client.set(c ?? null);
        this.form.reset({
          titre: '',
          style: 'Blackwork',
          zone: '',
          statut: 'En attente',
          montant: 0,
          seancesPrevues: 1,
        });
      }
      this.erreur.set('');
    });
  }

  onClientChoisi(c: ClientMini) {
    this.client.set(c);
  }

  valider() {
    const c = this.client();
    if (!c) {
      this.erreur.set('Choisissez un client.');
      return;
    }
    this.form.markAllAsTouched();
    const form = this.form.getRawValue();
    if (!form.titre.trim()) {
      this.erreur.set('Donnez un titre au projet.');
      return;
    }
    if (this.form.invalid) {
      this.erreur.set('Vérifiez les champs du formulaire.');
      return;
    }
    this.erreur.set('');
    this.enregistrer.emit({
      titre: form.titre.trim(),
      clientId: c.id,
      clientNom: c.nom,
      initiales: c.initiales,
      style: form.style,
      zone: form.zone.trim() || 'À définir',
      statut: form.statut,
      montant: Number(form.montant) || 0,
      seancesPrevues: Math.max(1, Number(form.seancesPrevues) || 1),
    });
  }
}
