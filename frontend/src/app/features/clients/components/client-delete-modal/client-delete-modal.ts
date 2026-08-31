import { Component, input, output } from '@angular/core';
import { Button } from '../../../../shared/button/button';
import { Icon } from '../../../../shared/ui/icon';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-client-delete-modal',
  host: { '(document:keydown.escape)': 'dismiss.emit()' },
  imports: [Button, Icon],
  templateUrl: './client-delete-modal.html',
})
export class ClientDeleteModal {
  client = input<Client | null>(null);
  confirm = output<Client>();
  dismiss = output<void>();
}
