import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Button } from '../../shared/button/button';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { StudioService } from '../../core/studio/studio.service';
import { toStudioJson } from '../../core/studio/models/studio.model';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-parametres',
  imports: [ReactiveFormsModule, Button, Icon, PageHeader],
  templateUrl: './parametres.html',
})
export class Parametres {
  private fb = inject(FormBuilder);
  private service = inject(StudioService);
  private auth = inject(AuthService);

  studio = this.service.studio;

  // Seul un administrateur peut modifier les paramètres du studio.
  estAdmin = computed(() => this.auth.user()?.role === 'admin');

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    subtitle: [''],
    email: ['', Validators.email],
    phone: [''],
    address: [''],
    siret: [''],
    tvaMention: [''],
    quotePrefix: ['DEV'],
    invoicePrefix: ['FAC'],
    paymentTerms: [''],
    depositTerms: [''],
    notifyRdv: [true],
    notifyInvoices: [true],
  });

  private nameValue = toSignal(this.form.controls.name.valueChanges, { initialValue: '' });

  nomAffiche = computed(() => (this.nameValue() || this.studio()?.name || 'Studio').trim());

  initiales = computed(() => {
    const nom = this.nomAffiche();
    const lettres = nom
      .split(/\s+/)
      .map((mot) => mot[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return lettres || 'S';
  });

  constructor() {
    effect(() => {
      const s = this.studio();
      if (!s) return;
      this.form.patchValue({
        name: s.name,
        subtitle: s.subtitle,
        email: s.email,
        phone: s.phone,
        address: s.address,
        siret: s.siret,
        tvaMention: s.tvaMention,
        quotePrefix: s.quotePrefix,
        invoicePrefix: s.invoicePrefix,
        paymentTerms: s.paymentTerms,
        depositTerms: s.depositTerms,
        notifyRdv: s.notifyRdv,
        notifyInvoices: s.notifyInvoices,
      });
    });

    // Les artistes consultent les paramètres en lecture seule.

    effect(() => {
      if (this.estAdmin()) this.form.enable({ emitEvent: false });
      else this.form.disable({ emitEvent: false });
    });
  }

  toggleFondClass(actif: boolean): string {
    return actif ? 'bg-primary' : 'bg-surface-2 ring-1 ring-border';
  }

  togglePastilleClass(actif: boolean): string {
    return actif ? 'translate-x-5' : 'translate-x-0';
  }

  mentionTva(): string {
    return this.form.controls.tvaMention.value;
  }

  rappelsRdv(): boolean {
    return this.form.controls.notifyRdv.value;
  }

  notificationsFactures(): boolean {
    return this.form.controls.notifyInvoices.value;
  }

  toggleRappelsRdv() {
    if (!this.estAdmin()) return;
    this.form.controls.notifyRdv.setValue(!this.rappelsRdv());
  }

  toggleNotificationsFactures() {
    if (!this.estAdmin()) return;
    this.form.controls.notifyInvoices.setValue(!this.notificationsFactures());
  }

  enregistrer() {
    if (!this.estAdmin()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.service
      .update(toStudioJson({ id: this.studio()?.id ?? 0, ...this.form.getRawValue() }))
      .subscribe();
  }
}
