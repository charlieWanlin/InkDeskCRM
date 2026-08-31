import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ClientJson } from '../models/client-json';
import { ListFilters, toListParams } from '../../../shared/data/list-query';

@Service()
export class ClientService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/clients`;

  list(filters: ListFilters = {}) {
    return this.http.get<ClientJson[]>(this.base, { params: toListParams(filters) });
  }

  get(id: number) {
    return this.http.get<ClientJson>(`${this.base}/${id}`);
  }

  create(body: Partial<ClientJson>) {
    return this.http.post<ClientJson>(this.base, body);
  }

  update(id: number, body: Partial<ClientJson>) {
    return this.http.put<ClientJson>(`${this.base}/${id}`, body);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
