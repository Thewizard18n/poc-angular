import { inject, Injectable } from '@angular/core';
import { ComprasRepository } from '../../data-access';

@Injectable({ providedIn: 'root' })
export class ConsultarUsecase {
  protected readonly repository = inject(ComprasRepository);
}
