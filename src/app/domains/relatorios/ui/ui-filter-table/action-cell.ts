import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

import { TableGridContext } from './ui-filter-table';

@Component({
  selector: 'app-action-cell',
  imports: [MatButtonModule, MatIcon],
  template: `
    <button
      mat-mini-fab
      type="button"
      class="action-button"
      [class.active]="active()"
      aria-label="Destacar item no mapa"
      (click)="onClick()">
      <mat-icon>place</mat-icon>
    </button>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
    .action-button {
      width: 32px;
      height: 32px;
      min-height: 32px;
      background: #f8fafc;
      color: #64748b;
      box-shadow: none;
      transition:
        background-color 0.15s,
        color 0.15s;
    }

    .action-button:hover,
    .action-button.active {
      background: #dbeafe;
      color: #2563eb;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionCellRenderer implements ICellRendererAngularComp {
  readonly active = signal(false);
  private params!: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.active.set((params.context as TableGridContext).highlightedRowId === params.node.id);
  }

  refresh(): boolean {
    this.active.set((this.params.context as TableGridContext).highlightedRowId === this.params.node.id);
    return true;
  }

  onClick(): void {
    const ctx = this.params.context as TableGridContext;
    const nodeId = this.params.node.id;
    const gridEl = this.params.eGridCell.closest('.table-grid');

    if (ctx.highlightedRowId === nodeId) {
      ctx.highlightedRowId = null;
      gridEl?.classList.remove('has-active-action');
    } else {
      ctx.highlightedRowId = nodeId ?? null;
      if (!this.params.node.isSelected()) {
        this.params.node.setSelected(true);
      }
      gridEl?.classList.add('has-active-action');
    }

    this.params.api.redrawRows();
  }
}
