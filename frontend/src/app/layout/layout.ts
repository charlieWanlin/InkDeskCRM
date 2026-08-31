import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Breadcrumb } from './breadcrumb';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Sidebar, Topbar, Breadcrumb],
  templateUrl: './layout.html',
})
export class Layout {
  private router = inject(Router);

  collapsed = signal(localStorage.getItem('sidebar-reduit') === '1');
  mobileOpen = signal(false);

  constructor() {

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.mobileOpen.set(false));
  }

  onToggle() {
    const desktop = window.matchMedia('(min-width: 1024px)').matches;
    if (desktop) {
      this.collapsed.update((v) => !v);
      localStorage.setItem('sidebar-reduit', this.collapsed() ? '1' : '0');
    } else {
      this.mobileOpen.update((v) => !v);
    }
  }

  closeMobile() {
    this.mobileOpen.set(false);
  }
}
