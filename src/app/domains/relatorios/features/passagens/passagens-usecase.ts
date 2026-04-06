import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  private readonly filtroSubject = new BehaviorSubject<PassagensFilterPayload>({
    veiculos: [],
    dataInicio: null,
    dataFim: null,
    horarioInicio: '',
    horarioFim: '',
  });
  private readonly colunasSubject = new BehaviorSubject<PassagensColumnConfig[]>(this.colunasIniciais);
  private readonly acoesHabilitadasSubject = new BehaviorSubject<boolean>(false);
  private readonly modoDownloadSubject = new BehaviorSubject<boolean>(false);
  private readonly tabelaRowsSubject = new BehaviorSubject<PassagemTableRow[]>([]);

  readonly viewModel$: Observable<PassagensViewModel> = combineLatest([
    this.filtroSubject,
    this.colunasSubject,
    this.acoesHabilitadasSubject,
    this.modoDownloadSubject,
  ]).pipe(
    map(([filtro, colunas, mostrarAcoesPosFiltro, modoDownloadAtivo]) => ({
      titulo: 'Titulo',
      veiculosDisponiveis: this.veiculosDisponiveis,
      veiculosSelecionados: filtro.veiculos,
      dataInicio: filtro.dataInicio,
      dataFim: filtro.dataFim,
      horarioInicio: filtro.horarioInicio,
      horarioFim: filtro.horarioFim,
      colunas,
      mostrarAcoesPosFiltro,
      modoDownloadAtivo,
      exibirImagemInicial: !mostrarAcoesPosFiltro,
    })),
  );

  readonly tabelaRows$ = this.tabelaRowsSubject.asObservable();

  toggleVeiculo(veiculo: string): void {
    const filtro = this.filtroSubject.value;
    const jaSelecionado = filtro.veiculos.includes(veiculo);
    const proximoVeiculos = jaSelecionado
      ? filtro.veiculos.filter((item) => item !== veiculo)
      : [...filtro.veiculos, veiculo];

    this.filtroSubject.next({ ...filtro, veiculos: proximoVeiculos });
  }

  atualizarDataInicio(dataInicio: Date | null): void {
    this.filtroSubject.next({ ...this.filtroSubject.value, dataInicio });
  }

  atualizarDataFim(dataFim: Date | null): void {
    this.filtroSubject.next({ ...this.filtroSubject.value, dataFim });
  }

  cancelarFiltroData(): void {
    this.filtroSubject.next({
      ...this.filtroSubject.value,
      dataInicio: null,
      dataFim: null,
    });
  }

  aplicarFiltroData(): void {
    this.repository.salvarFiltroData(this.filtroSubject.value).subscribe();
  }

  atualizarHorarioInicio(horarioInicio: string): void {
    this.filtroSubject.next({ ...this.filtroSubject.value, horarioInicio });
  }

  atualizarHorarioFim(horarioFim: string): void {
    this.filtroSubject.next({ ...this.filtroSubject.value, horarioFim });
  }

  aplicarFiltros(): void {
    const filtroAtual = this.filtroSubject.value;
    this.acoesHabilitadasSubject.next(true);
    this.repository.getPassagens(filtroAtual).subscribe((rows) => this.tabelaRowsSubject.next(rows));
  }

  toggleColuna(colunaId: PassagensDataColumnId): void {
    const proximaLista = this.colunasSubject.value.map((coluna) =>
      coluna.id === colunaId ? { ...coluna, visible: !coluna.visible } : coluna,
    );
    this.colunasSubject.next(proximaLista);
  }

  reordenarColunas(previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) {
      return;
    }

    const colunas = [...this.colunasSubject.value];
    const [movida] = colunas.splice(previousIndex, 1);
    colunas.splice(currentIndex, 0, movida);
    this.colunasSubject.next(colunas);
  }

  alterarModoDownload(ativo: boolean): void {
    this.modoDownloadSubject.next(ativo);
  }

  getDisplayedColumns(colunas: PassagensColumnConfig[]): PassagensDataColumnId[] {
    return colunas.filter((coluna) => coluna.visible).map((coluna) => coluna.id);
  }
}
