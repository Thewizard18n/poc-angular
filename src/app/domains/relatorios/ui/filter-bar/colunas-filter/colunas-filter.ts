import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { PassagensColumnConfig, PassagensDataColumnId } from '../../../features/passagens/passagens.models';

@Component({
  selector: 'app-colunas-filter',
  imports: [DragDropModule, MatButtonModule, MatCheckboxModule, MatIconModule, MatMenuModule],
  templateUrl: './colunas-filter.html',
  styleUrl: './colunas-filter.scss',
})
export class ColunasFilter {
  readonly colunas = input.required<PassagensColumnConfig[]>();

  readonly colunaToggle = output<PassagensDataColumnId>();
  readonly colunasReorder = output<{ previousIndex: number; currentIndex: number }>();

  onDrop(event: CdkDragDrop<PassagensColumnConfig[]>): void {
    this.colunasReorder.emit({
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
    });
  }

  getColunasSelecionadasLabel(): string {
    const selecionadas = this.colunas()
      .filter((coluna) => coluna.visible)
      .map((coluna) => coluna.label);

    return selecionadas.join(', ');
  }
}
