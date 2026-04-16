import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

import { TableGridContext } from './ui-filter-table';

@Component({
  selector: 'app-checkbox-cell',
  imports: [MatCheckbox],
  template: `<mat-checkbox [checked]="checked()" (change)="onToggle()" />`,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxCellRenderer implements ICellRendererAngularComp {
  readonly checked = signal(false);
  private params!: ICellRendererParams;

  private get ctx(): TableGridContext {
    return this.params.context as TableGridContext;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.checked.set(params.node.isSelected() ?? false);
  }

  refresh(params: ICellRendererParams): boolean {
    this.checked.set(params.node.isSelected() ?? false);
    return true;
  }

  onToggle(): void {
    const next = !this.params.node.isSelected();
    if (!next) {
      this.ctx.selectAllActive = false;
    }
    this.params.node.setSelected(next);
    this.checked.set(next);
    this.params.api.refreshCells({ force: true, columns: [this.params.column!] });
  }
}
