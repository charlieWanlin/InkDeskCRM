import { HttpParams } from '@angular/common/http';

// Les filtres vides sont omis des query params.

export interface ListFilters {
  search?: string;
  status?: string;
  style?: string;
  sort?: string;
}

export function toListParams(filters: ListFilters = {}): HttpParams {
  let params = new HttpParams();
  if (filters.search) params = params.set('search', filters.search);
  if (filters.status) params = params.set('status', filters.status);
  if (filters.style) params = params.set('style', filters.style);
  if (filters.sort) params = params.set('sort', filters.sort);
  return params;
}
