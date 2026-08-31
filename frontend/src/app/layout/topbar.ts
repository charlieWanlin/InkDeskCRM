import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../shared/ui/icon';
import { ThemeToggle } from '../shared/theme-toggle/theme-toggle';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-topbar',
  host: { '(document:click)': 'closeMenu()' },
  imports: [RouterLink, Icon, ThemeToggle],
  templateUrl: './topbar.html',
})
export class Topbar {
  private auth = inject(AuthService);

  user = this.auth.user;

  initiales = computed(() => {
    const nom = this.user()?.name ?? '';
    return nom
      .split(' ')
      .map((m) => m[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  });

  toggleSidebar = output<void>();

  mobileOpen = input(false);

  menuOpen = signal(false);
  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }
  closeMenu() {
    this.menuOpen.set(false);
  }

  logout() {
    this.auth.logout();
  }
}
