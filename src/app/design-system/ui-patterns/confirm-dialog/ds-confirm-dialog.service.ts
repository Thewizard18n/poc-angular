import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';

import { DsConfirmDialog, DsConfirmDialogData } from './ds-confirm-dialog';

@Injectable({ providedIn: 'root' })
export class DsConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  confirm(options: DsConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open(DsConfirmDialog, {
        width: '420px',
        maxWidth: '92vw',
        data: options,
      })
      .afterClosed()
      .pipe(map((result) => !!result));
  }
}
