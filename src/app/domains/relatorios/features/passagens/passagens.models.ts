export interface PassagensFilterPayload {
  veiculos: string[];
  dataInicio: Date | null;
  dataFim: Date | null;
  horarioInicio: string;
  horarioFim: string;
}

export interface PassagemTableRow {
  id: number;
  teste1: string;
  teste2: string;
}

export type PassagensDataColumnId = 'teste1' | 'teste2';

export interface PassagensColumnConfig {
  id: PassagensDataColumnId;
  label: string;
  visible: boolean;
}

export interface PassagensViewModel {
  titulo: string;
  veiculosDisponiveis: string[];
  veiculosSelecionados: string[];
  dataInicio: Date | null;
  dataFim: Date | null;
  horarioInicio: string;
  horarioFim: string;
  colunas: PassagensColumnConfig[];
  mostrarAcoesPosFiltro: boolean;
  modoDownloadAtivo: boolean;
  exibirImagemInicial: boolean;
}
