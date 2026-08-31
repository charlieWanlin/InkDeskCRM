import { Component, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/ui/icon';
import { Avatar } from '../../../../shared/ui/avatar';
import { StatusBadge } from '../../../../shared/status-badge/status-badge';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-client-cards',
  imports: [CurrencyPipe, DatePipe, RouterLink, Icon, Avatar, StatusBadge],
  templateUrl: './client-cards.html',
})
export class ClientCards {
  clients = input.required<Client[]>();
  view = input<'liste' | 'grille'>('liste');

  edit = output<Client>();
  remove = output<Client>();

  initials(c: Client): string {
    return (c.firstName.charAt(0) + c.lastName.charAt(0)).toUpperCase();
  }
}
