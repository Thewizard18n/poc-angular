import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { DsCard } from '../../../../design-system/ui-primitives/card/ds-card';
import { FilterBar } from '../../ui/filter-bar/filter-bar';
import { UiFilterTable } from '../../ui/ui-filter-table/ui-filter-table';
import { UiMapa } from '../../ui/ui-mapa/ui-mapa';
import { PassagensUsecase } from './passagens-usecase';
import { PassagensViewModel } from './passagens.models';

@Component({
  selector: 'app-passagens',
  imports: [DsCard, FilterBar, UiFilterTable, UiMapa],
  templateUrl: './passagens.html',
  styleUrl: './passagens.scss',
})
export class Passagens {
  protected readonly usecase = inject(PassagensUsecase);

  protected readonly vm = toSignal(this.usecase.viewModel$, {
    initialValue: {
      titulo: 'Titulo',
      veiculosDisponiveis: [],
      veiculosSelecionados: [],
      dataInicio: null,
      dataFim: null,
      horarioInicio: '',
      horarioFim: '',
      colunas: [],
      mostrarAcoesPosFiltro: false,
      modoDownloadAtivo: false,
      exibirImagemInicial: true,
    } as PassagensViewModel,
  });

  protected readonly rows = toSignal(this.usecase.tabelaRows$, { initialValue: [] });
  protected readonly displayedColumns = computed(() => this.usecase.getDisplayedColumns(this.vm().colunas));

  protected onReorderColunas(event: { previousIndex: number; currentIndex: number }): void {
    this.usecase.reordenarColunas(event.previousIndex, event.currentIndex);
  }
}
