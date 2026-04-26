import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PassagensDataAccess } from '../../data-access';
import {
  AddressLookupRequestPayload,
  AddressLookupResponse,
  PassagensRequestPayload,
  PassagensResponse,
} from './passagens.models';

@Injectable({ providedIn: 'root' })
export class PassagensUsecase {
  private readonly repository = inject(PassagensDataAccess);

  getPassagens(payload: PassagensRequestPayload): Observable<PassagensResponse> {
    return this.repository.getPassagens(payload);
  }

  getAddressByLocations(payload: AddressLookupRequestPayload): Observable<AddressLookupResponse> {
    return this.repository.getAddressByLocations(payload);
  }

  // Reserved for future API that persists selected filters.
}
