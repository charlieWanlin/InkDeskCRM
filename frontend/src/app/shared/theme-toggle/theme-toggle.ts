import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
})
export class ThemeToggle {
  sombre = signal(localStorage.getItem('theme') === 'dark');

  constructor() {
    this.appliquer();
  }

  basculer() {
    this.sombre.update((v) => !v);
    this.appliquer();
  }

  private appliquer() {
    const html = document.documentElement;
    html.classList.toggle('dark', this.sombre());
    localStorage.setItem('theme', this.sombre() ? 'dark' : 'light');
  }
}
