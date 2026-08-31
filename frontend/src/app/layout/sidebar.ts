import { Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { StudioService } from '../core/studio/studio.service';

@Component({
  selector: 'app-sidebar',
  host: { class: 'contents' },
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  collapsed = input(false);
  mobileOpen = input(false);

  studio = inject(StudioService).studio;
  softwareName = 'InkDesk Software';
  shopName = 'L’Encre de Lune';

  narrow = computed(() => this.collapsed() && !this.mobileOpen());
}
