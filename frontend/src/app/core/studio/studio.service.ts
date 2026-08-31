import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StudioJson } from './models/studio-json';
import { Studio, toStudio } from './models/studio.model';

// Réglages du studio partagés via un signal applicatif.

@Service()
export class StudioService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private _studio = signal<Studio | null>(null);

  studio = this._studio.asReadonly();

  constructor() {
    this.load();
  }

  load() {
    this.http.get<StudioJson>(`${this.base}/studio`).subscribe({
      next: (json) => this._studio.set(toStudio(json)),
      error: () => this._studio.set(null),
    });
  }

  update(body: Partial<StudioJson>) {
    return this.http
      .put<StudioJson>(`${this.base}/studio`, body)
      .pipe(tap((json) => this._studio.set(toStudio(json))));
  }
}
