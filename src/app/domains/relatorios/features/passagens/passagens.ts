import { Component, inject } from '@angular/core';

import { DsCard } from '../../../../design-system/ui-primitives/card/ds-card';
import { FilterBar } from '../../ui/filter-bar/filter-bar';
import { UiFilterTable } from '../../ui/ui-filter-table/ui-filter-table';
import { UiMapa } from '../../ui/ui-mapa/ui-mapa';
import { PassagensUsecase } from './passagens-usecase';

@Component({
  selector: 'app-passagens',
  imports: [DsCard, FilterBar, UiFilterTable, UiMapa],
  templateUrl: './passagens.html',
  styleUrl: './passagens.scss',
})
export class Passagens {
  protected readonly usecase = inject(PassagensUsecase);

  protected readonly vm = this.usecase.vm;
  protected readonly rows = this.usecase.rows;
  protected readonly displayedColumns = this.usecase.displayedColumns;

  protected onReorderColunas(event: { previousIndex: number; currentIndex: number }): void {
    this.usecase.reordenarColunas(event.previousIndex, event.currentIndex);
  }
}
