import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
})
export class Pagination {
  page = input.required<number>();
  totalPages = input.required<number>();
  indexDebut = input.required<number>();
  indexFin = input.required<number>();
  total = input.required<number>();

  pageChange = output<number>();

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  aller(p: number) {
    this.pageChange.emit(p);
  }
  precedent() {
    if (this.page() > 1) this.pageChange.emit(this.page() - 1);
  }
  suivant() {
    if (this.page() < this.totalPages()) this.pageChange.emit(this.page() + 1);
  }
}
