import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ProjectJson, SessionJson, PhotoJson } from '../models/project-json';
import { ListFilters, toListParams } from '../../../shared/data/list-query';

@Service()
export class ProjectService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list(filters: ListFilters = {}) {
    return this.http.get<ProjectJson[]>(`${this.base}/projects`, { params: toListParams(filters) });
  }

  get(id: number) {
    return this.http.get<ProjectJson>(`${this.base}/projects/${id}`);
  }

  create(body: Partial<ProjectJson>) {
    return this.http.post<ProjectJson>(`${this.base}/projects`, body);
  }

  update(id: number, body: Partial<ProjectJson>) {
    return this.http.put<ProjectJson>(`${this.base}/projects/${id}`, body);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/projects/${id}`);
  }

  listSessions() {
    return this.http.get<SessionJson[]>(`${this.base}/sessions`);
  }

  createSession(body: Partial<SessionJson>) {
    return this.http.post<SessionJson>(`${this.base}/sessions`, body);
  }

  updateSession(id: number, body: Partial<SessionJson>) {
    return this.http.put<SessionJson>(`${this.base}/sessions/${id}`, body);
  }

  removeSession(id: number) {
    return this.http.delete<void>(`${this.base}/sessions/${id}`);
  }

  createPhoto(body: Partial<PhotoJson>) {
    return this.http.post<PhotoJson>(`${this.base}/photos`, body);
  }

  removePhoto(id: number) {
    return this.http.delete<void>(`${this.base}/photos/${id}`);
  }
}
