import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Button } from '../../../../shared/button/button';
import { Icon } from '../../../../shared/ui/icon';
import { Flash, FLASH_STATUTS, FLASH_STYLES } from '../../models/flash.model';
import { FlashService } from '../../data/flash.service';

@Component({
  selector: 'app-flash-edit-modal',
  host: { '(document:keydown.escape)': 'dismiss.emit()' },
  imports: [ReactiveFormsModule, Button, Icon],
  templateUrl: './flash-edit-modal.html',
})
export class FlashEditModal {
  private fb = inject(FormBuilder);
  private flashService = inject(FlashService);

  flash = input<Flash | null>(null);
  save = output<Flash>();
  dismiss = output<void>();

  estCreation = computed(() => (this.flash()?.id ?? 0) === 0);

  styles = FLASH_STYLES;
  statuses = FLASH_STATUTS;

  // Image : aperçu affiché + états du téléversement.
  apercu = signal('');
  televersement = signal(false);
  erreurImage = signal('');

  form = this.fb.nonNullable.group({
    name: '',
    price: 0,
    style: '',
    placement: '',
    sizeCm: null as number | null,
    status: 'disponible' as Flash['status'],
  });

  constructor() {
    effect(() => {
      const f = this.flash();
      if (f) {
        this.apercu.set(f.imageUrl ?? '');
        this.erreurImage.set('');
        this.form.patchValue({
          name: f.name,
          price: f.price,
          style: f.style,
          placement: f.placement,
          sizeCm: f.sizeCm,
          status: f.status,
        });
      }
    });
  }

  // Sélection d'un fichier → validation simple puis téléversement.
  onFichier(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      this.erreurImage.set('Format non supporté : PNG ou JPEG uniquement.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.erreurImage.set('Image trop lourde (5 Mo maximum).');
      return;
    }

    this.erreurImage.set('');
    this.televersement.set(true);
    this.flashService.upload(file).subscribe({
      next: (res) => {
        this.apercu.set(res.url);
        this.televersement.set(false);
      },
      error: (e) => {
        this.erreurImage.set(e?.error?.error ?? 'Échec du téléversement.');
        this.televersement.set(false);
      },
    });
  }

  submit() {
    const f = this.flash();
    if (!f) return;
    const v = this.form.getRawValue();
    this.save.emit({
      ...f,
      name: v.name,
      imageUrl: this.apercu(),
      price: Number(v.price) || 0,
      style: v.style,
      placement: v.placement,
      sizeCm: v.sizeCm != null ? Number(v.sizeCm) : null,
      status: v.status,
    });
  }
}
