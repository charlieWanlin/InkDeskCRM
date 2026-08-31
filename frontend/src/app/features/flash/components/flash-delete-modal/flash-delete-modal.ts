import { Component, input, output } from '@angular/core';
import { Button } from '../../../../shared/button/button';
import { Icon } from '../../../../shared/ui/icon';
import { Flash } from '../../models/flash.model';

@Component({
  selector: 'app-flash-delete-modal',
  host: { '(document:keydown.escape)': 'dismiss.emit()' },
  imports: [Button, Icon],
  templateUrl: './flash-delete-modal.html',
})
export class FlashDeleteModal {
  flash = input<Flash | null>(null);
  confirm = output<Flash>();
  dismiss = output<void>();
}
