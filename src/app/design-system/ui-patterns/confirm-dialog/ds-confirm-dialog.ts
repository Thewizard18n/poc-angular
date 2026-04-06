import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { DsButton, DsButtonVariant } from '../../ui-primitives';

export interface DsConfirmDialogData {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: DsButtonVariant;
}

@Component({
  selector: 'ds-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, DsButton],
  templateUrl: './ds-confirm-dialog.html',
  styleUrl: './ds-confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsConfirmDialog {
  protected readonly data = inject<DsConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DsConfirmDialog, boolean>);

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirm(): void {
    this.dialogRef.close(true);
  }
}
