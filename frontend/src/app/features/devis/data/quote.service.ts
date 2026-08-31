import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { QuoteJson } from '../models/quote-json';
import { ListFilters, toListParams } from '../../../shared/data/list-query';

@Service()
export class QuoteService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list(filters: ListFilters = {}) {
    return this.http.get<QuoteJson[]>(`${this.base}/quotes`, { params: toListParams(filters) });
  }

  get(id: number) {
    return this.http.get<QuoteJson>(`${this.base}/quotes/${id}`);
  }

  create(body: Partial<QuoteJson>) {
    return this.http.post<QuoteJson>(`${this.base}/quotes`, body);
  }

  update(id: number, body: Partial<QuoteJson>) {
    return this.http.put<QuoteJson>(`${this.base}/quotes/${id}`, body);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/quotes/${id}`);
  }
}
