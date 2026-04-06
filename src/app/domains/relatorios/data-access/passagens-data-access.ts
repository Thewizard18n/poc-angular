import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { PassagemTableRow, PassagensFilterPayload } from '../features/passagens/passagens.models';

@Injectable({ providedIn: 'root' })
export class PassagensDataAccess {
  private readonly rowsMock: PassagemTableRow[] = [
    { id: 1, teste1: 'apple', teste2: 'Link' },
    { id: 2, teste1: 'banana', teste2: 'Link' },
    { id: 3, teste1: 'orange', teste2: 'Link' },
  ];

  getPassagens(_filtro: PassagensFilterPayload): Observable<PassagemTableRow[]> {
    return of(this.rowsMock).pipe(delay(150));
  }

  salvarFiltroData(_filtro: PassagensFilterPayload): Observable<void> {
    return of(void 0).pipe(delay(100));
  }
}
