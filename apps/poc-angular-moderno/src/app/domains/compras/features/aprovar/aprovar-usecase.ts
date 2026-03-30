import { inject, Injectable } from '@angular/core';
import { ComprasRepository } from '../../data-access';

@Injectable({ providedIn: 'root' })
export class AprovarUsecase {
  protected readonly repository = inject(ComprasRepository);
}
