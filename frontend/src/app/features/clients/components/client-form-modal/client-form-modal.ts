import { Component, inject, input, output, effect, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ClientService } from '../../data/client.service';
import { toClient, toClientJson, ClientStatut } from '../../models/client.model';
import { Button } from '../../../../shared/button/button';

@Component({
  selector: 'app-client-form-modal',
  host: { '(document:keydown.escape)': 'dismiss.emit()' },
  imports: [ReactiveFormsModule, Button],
  templateUrl: './client-form-modal.html',
})
export class ClientFormModal {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);

  clientToEdit = input<{ id: number } | null>(null);
  dismiss = output<void>();
  saved = output<void>();

  clientForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', Validators.email],
    phone: [''],
    address: [''],
    birthdate: [''],
    style: [''],
    status: ['prospect' as ClientStatut],
    allergies: [''],
    healthNotes: [''],
    notes: [''],
  });

  serverError = signal('');

  constructor() {

    effect(() => {
      const client = this.clientToEdit();
      if (!client) return;
      this.clientService.get(client.id).subscribe((json) => {
        this.clientForm.patchValue(toClient(json));
      });
    });
  }

  error(name: string): string | null {
    const c = this.clientForm.get(name);
    if (!c || c.valid || !c.touched) return null;
    if (c.hasError('required')) return 'Ce champ est obligatoire.';
    if (c.hasError('email')) return 'E-mail invalide.';
    return null;
  }

  async onSubmit() {
    this.clientForm.markAllAsTouched();
    if (this.clientForm.invalid) return;

    const client = this.clientToEdit();
    const payload = toClientJson(this.clientForm.getRawValue());
    try {
      if (client) {
        await firstValueFrom(this.clientService.update(client.id, payload));
      } else {
        await firstValueFrom(this.clientService.create(payload));
      }
      this.saved.emit();
    } catch {
      this.serverError.set('Impossible d’enregistrer, réessayez.');
    }
  }
}
