import { Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Icon } from '../../../../shared/ui/icon';
import { FlashCard } from '../flash-card/flash-card';
import { Flash, flashStatutClass, flashStatutLabel } from '../../models/flash.model';

@Component({
  selector: 'app-flash-cards',
  imports: [CurrencyPipe, Icon, FlashCard],
  templateUrl: './flash-cards.html',
})
export class FlashCards {
  flashs = input.required<Flash[]>();
  view = input<'liste' | 'grille'>('grille');

  edit = output<Flash>();
  remove = output<Flash>();

  statusClass = flashStatutClass;
  statusLabel = flashStatutLabel;
}
