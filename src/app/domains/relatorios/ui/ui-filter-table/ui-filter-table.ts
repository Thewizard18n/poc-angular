import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

import { DsEmptyState } from '../../../../design-system/ui-primitives/empty-state/ds-empty-state';
import {
  PassagemTableRow,
  PassagensDataColumnId,
  PassagensViewModel,
} from '../../features/passagens/passagens.models';

@Component({
  selector: 'app-ui-filter-table',
  imports: [CommonModule, DsEmptyState, MatTableModule],
  templateUrl: './ui-filter-table.html',
  styleUrl: './ui-filter-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFilterTable {
  readonly vm = input.required<PassagensViewModel>();
  readonly rows = input.required<PassagemTableRow[]>();
  readonly displayedColumns = input.required<PassagensDataColumnId[]>();
}
