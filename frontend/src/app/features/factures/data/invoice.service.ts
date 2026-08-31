import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { InvoiceJson } from '../models/invoice-json';
import { ListFilters, toListParams } from '../../../shared/data/list-query';

@Service()
export class InvoiceService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list(filters: ListFilters = {}) {
    return this.http.get<InvoiceJson[]>(`${this.base}/invoices`, { params: toListParams(filters) });
  }

  get(id: number) {
    return this.http.get<InvoiceJson>(`${this.base}/invoices/${id}`);
  }

  create(body: Partial<InvoiceJson>) {
    return this.http.post<InvoiceJson>(`${this.base}/invoices`, body);
  }

  update(id: number, body: Partial<InvoiceJson>) {
    return this.http.put<InvoiceJson>(`${this.base}/invoices/${id}`, body);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/invoices/${id}`);
  }

  fromQuote(quoteId: number) {
    return this.http.post<InvoiceJson>(`${this.base}/invoices/from-quote/${quoteId}`, {});
  }
}
