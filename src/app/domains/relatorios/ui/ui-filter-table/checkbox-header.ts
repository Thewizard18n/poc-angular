import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';

import { TableGridContext } from './ui-filter-table';

@Component({
  selector: 'app-checkbox-header',
  imports: [MatCheckbox],
  template: `
    <mat-checkbox
      [checked]="allSelected"
      [indeterminate]="indeterminate"
      (change)="onToggle()"
    />
  `,
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
export class CheckboxHeaderRenderer implements IHeaderAngularComp, OnDestroy {
  allSelected = false;
  indeterminate = false;

  private params!: IHeaderParams;
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly listener = () => this.syncState();

  private get ctx(): TableGridContext {
    return this.params.context as TableGridContext;
  }

  agInit(params: IHeaderParams): void {
    this.params = params;
    params.api.addEventListener('selectionChanged', this.listener);
    params.api.addEventListener('modelUpdated', this.listener);
  }

  refresh(): boolean {
    return true;
  }

  ngOnDestroy(): void {
    this.params?.api?.removeEventListener('selectionChanged', this.listener);
    this.params?.api?.removeEventListener('modelUpdated', this.listener);
  }

  onToggle(): void {
    const shouldSelect = !(this.allSelected || this.indeterminate);
    this.ctx.selectAllActive = shouldSelect;

    this.params.api.forEachNode((node) => {
      if (node.data) {
        node.setSelected(shouldSelect);
      }
    });
    this.params.api.refreshCells({ force: true });
  }

  private syncState(): void {
    let selectedCount = 0;
    let loadedCount = 0;
    this.params.api.forEachNode((node) => {
      if (node.data) {
        loadedCount++;
        if (node.isSelected()) selectedCount++;
      }
    });
    this.allSelected = loadedCount > 0 && selectedCount === loadedCount;
    this.indeterminate = selectedCount > 0 && selectedCount < loadedCount;
    this.cdr.markForCheck();
  }
}
