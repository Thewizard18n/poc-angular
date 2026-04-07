import { computed, inject, Injectable, signal } from '@angular/core';

import { PassagensDataAccess } from '../../data-access';
import {
  PassagemTableRow,
  PassagensColumnConfig,
  PassagensDataColumnId,
  PassagensFilterPayload,
  PassagensViewModel,
} from './passagens.models';

@Injectable({ providedIn: 'root' })
export class PassagensUsecase {
  private readonly repository = inject(PassagensDataAccess);

  private readonly veiculosDisponiveis = ['Carro', 'Moto', 'Caminhao'];
  private readonly colunasIniciais: PassagensColumnConfig[] = [
    { id: 'teste1', label: 'Teste 1', visible: true },
    { id: 'teste2', label: 'Teste 2', visible: true },
  ];
  private readonly vmState = signal<PassagensViewModel>({
    titulo: 'Titulo',
    veiculosDisponiveis: this.veiculosDisponiveis,
    veiculosSelecionados: [],
    dataInicio: null,
    dataFim: null,
    horarioInicio: '',
    horarioFim: '',
    colunas: this.colunasIniciais,
    mostrarAcoesPosFiltro: false,
    modoDownloadAtivo: false,
    exibirImagemInicial: true,
  });
  private readonly rowsState = signal<PassagemTableRow[]>([]);

  readonly vm = this.vmState.asReadonly();
  readonly rows = this.rowsState.asReadonly();
  readonly displayedColumns = computed(() => this.vm().colunas.filter((coluna) => coluna.visible).map((coluna) => coluna.id));

  toggleVeiculo(veiculo: string): void {
    const vm = this.vm();
    const jaSelecionado = vm.veiculosSelecionados.includes(veiculo);
    const proximoVeiculos = jaSelecionado
      ? vm.veiculosSelecionados.filter((item) => item !== veiculo)
      : [...vm.veiculosSelecionados, veiculo];

    this.atualizarVm({ veiculosSelecionados: proximoVeiculos });
  }

  atualizarDataInicio(dataInicio: Date | null): void {
    this.atualizarVm({ dataInicio });
  }

  atualizarDataFim(dataFim: Date | null): void {
    this.atualizarVm({ dataFim });
  }

  cancelarFiltroData(): void {
    this.atualizarVm({ dataInicio: null, dataFim: null });
  }

  aplicarFiltroData(): void {
    this.repository.salvarFiltroData(this.getFiltroPayload()).subscribe();
  }

  atualizarHorarioInicio(horarioInicio: string): void {
    this.atualizarVm({ horarioInicio });
  }

  atualizarHorarioFim(horarioFim: string): void {
    this.atualizarVm({ horarioFim });
  }

  aplicarFiltros(): void {
    this.atualizarVm({ mostrarAcoesPosFiltro: true });
    this.repository.getPassagens(this.getFiltroPayload()).subscribe((rows) => this.rowsState.set(rows));
  }

  toggleColuna(colunaId: PassagensDataColumnId): void {
    const proximaLista = this.vm().colunas.map((coluna) =>
      coluna.id === colunaId ? { ...coluna, visible: !coluna.visible } : coluna,
    );
    this.atualizarVm({ colunas: proximaLista });
  }

  reordenarColunas(previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) {
      return;
    }

    const colunas = [...this.vm().colunas];
    const [movida] = colunas.splice(previousIndex, 1);
    colunas.splice(currentIndex, 0, movida);
    this.atualizarVm({ colunas });
  }

  alterarModoDownload(ativo: boolean): void {
    this.atualizarVm({ modoDownloadAtivo: ativo });
  }

  private atualizarVm(parcial: Partial<PassagensViewModel>): void {
    this.vmState.update((atual) => {
      const mostrarAcoesPosFiltro = parcial.mostrarAcoesPosFiltro ?? atual.mostrarAcoesPosFiltro;

      return {
        ...atual,
        ...parcial,
        exibirImagemInicial: !mostrarAcoesPosFiltro,
      };
    });
  }

  private getFiltroPayload(): PassagensFilterPayload {
    const vm = this.vm();
    return {
      veiculos: vm.veiculosSelecionados,
      dataInicio: vm.dataInicio,
      dataFim: vm.dataFim,
      horarioInicio: vm.horarioInicio,
      horarioFim: vm.horarioFim,
    };
  }
}
