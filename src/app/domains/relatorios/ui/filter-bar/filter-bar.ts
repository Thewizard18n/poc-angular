import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { DsButton } from '../../../../design-system/ui-primitives/button/ds-button';
import {
  PassagensColumnConfig,
  PassagensDataColumnId,
  PassagensViewModel,
} from '../../features/passagens/passagens.models';
import { HorarioFilter } from './horario-filter/horario-filter';
import { PeriodoFilter } from './periodo-filter/periodo-filter';
import { VeiculoFilter } from './veiculo-filter/veiculo-filter';

@Component({
  selector: 'app-filter-bar',
  imports: [
    CommonModule,
    DragDropModule,
    DsButton,
    HorarioFilter,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSlideToggleModule,
    PeriodoFilter,
    VeiculoFilter,
  ],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.scss',
})
export class FilterBar {
  readonly vm = input.required<PassagensViewModel>();

  readonly veiculoToggle = output<string>();
  readonly dataInicioChange = output<Date | null>();
  readonly dataFimChange = output<Date | null>();
  readonly dataCancel = output<void>();
  readonly dataApply = output<void>();
  readonly horarioInicioChange = output<string>();
  readonly horarioFimChange = output<string>();
  readonly filtrar = output<void>();
  readonly colunaToggle = output<PassagensDataColumnId>();
  readonly colunasReorder = output<{ previousIndex: number; currentIndex: number }>();
  readonly downloadModeChange = output<boolean>();

  onDrop(event: CdkDragDrop<PassagensColumnConfig[]>): void {
    this.colunasReorder.emit({
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
    });
  }
}
