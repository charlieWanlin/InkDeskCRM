import { Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Icon } from '../../../../shared/ui/icon';
import { Flash, flashStatutClass, flashStatutLabel } from '../../models/flash.model';

@Component({
  selector: 'app-flash-card',
  imports: [CurrencyPipe, Icon],
  templateUrl: './flash-card.html',
})
export class FlashCard {
  flash = input.required<Flash>();

  edit = output<Flash>();
  remove = output<Flash>();

  statusClass = flashStatutClass;
  statusLabel = flashStatutLabel;
}
