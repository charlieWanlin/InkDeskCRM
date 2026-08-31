import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { FlashJson } from '../models/flash-json';

export interface FlashFilters {
  search?: string;
  status?: string;
  style?: string;
  sort?: string;
}

@Service()
export class FlashService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list(filters: FlashFilters = {}) {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.style) params = params.set('style', filters.style);
    if (filters.sort) params = params.set('sort', filters.sort);
    return this.http.get<FlashJson[]>(`${this.base}/flashs`, { params });
  }

  create(body: Partial<FlashJson>) {
    return this.http.post<FlashJson>(`${this.base}/flashs`, body);
  }

  // Téléverse une image (PNG/JPEG) et renvoie son URL publique.
  upload(file: File) {
    const data = new FormData();
    data.append('image', file);
    return this.http.post<{ url: string; path: string }>(`${this.base}/flashs/upload`, data);
  }

  patch(id: number, body: Partial<FlashJson>) {
    return this.http.patch<FlashJson>(`${this.base}/flashs/${id}`, body);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/flashs/${id}`);
  }
}
