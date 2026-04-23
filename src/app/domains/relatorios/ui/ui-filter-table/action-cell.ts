import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

import { TableGridContext } from './ui-filter-table';

@Component({
  selector: 'app-action-cell',
  imports: [MatIcon],
  template: `<mat-icon class="action-icon" [class.active]="active()" (click)="onClick()">place</mat-icon>`,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
    .action-icon {
      cursor: pointer;
      color: #94a3b8;
      font-size: 20px;
      width: 20px;
      height: 20px;
      transition: color 0.15s;
    }
    .action-icon:hover,
    .action-icon.active {
      color: #3b82f6;
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

    if (ctx.highlightedRowId !== null) {
      const prevNode = this.params.api.getRowNode(ctx.highlightedRowId);
      prevNode?.setSelected(false);
    }

    if (ctx.highlightedRowId === nodeId) {
      ctx.highlightedRowId = null;
      gridEl?.classList.remove('has-active-action');
    } else {
      ctx.highlightedRowId = nodeId ?? null;
      this.params.node.setSelected(true);
      gridEl?.classList.add('has-active-action');
    }

    this.params.api.redrawRows();
  }
}
