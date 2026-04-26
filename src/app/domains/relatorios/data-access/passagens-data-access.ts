import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import {
  AddressLookupRequestPayload,
  AddressLookupResponse,
  PassagemPosition,
  PassagensRequestPayload,
  PassagensResponse,
} from '../features/passagens/passagens.models';

@Injectable({ providedIn: 'root' })
export class PassagensDataAccess {
  private readonly totalCount = 1000;

  getPassagens(payload: PassagensRequestPayload): Observable<PassagensResponse> {
    const { offset, limit } = payload.pagination;
    const startIndex = Math.max(0, offset);
    const endIndex = Math.min(startIndex + limit, this.totalCount);

    const positions: PassagemPosition[] = Array.from({ length: endIndex - startIndex }, (_, index) => {
      const rowId = startIndex + index + 1;
      return {
        createdAt: rowId,
        vehicleDisplay: `Veiculo ${rowId}`,
        driverName: `Motorista ${rowId}`,
        positionDatetime: `2026-04-10 08:${String(rowId % 60).padStart(2, '0')}`,
        positionReceivedAt: `2026-04-10 08:${String((rowId + 3) % 60).padStart(2, '0')}`,
        speed: `${40 + (rowId % 70)} km/h`,
        ignition: rowId % 2 === 0 ? 'Ligada' : 'Desligada',
        blocking: rowId % 3 === 0 ? 'Ativo' : 'Inativo',
        battery: `${12 + (rowId % 3)}V`,
        memory: `${50 + (rowId % 50)}%`,
        gps: rowId % 2 === 0 ? 'OK' : 'Sem sinal',
        satellite: `${8 + (rowId % 5)}`,
        latitude: `-23.${1000 + rowId}`,
        longitude: `-46.${2000 + rowId}`,
        latitudeLongitude: `-23.${1000 + rowId}, -46.${2000 + rowId}`,
        location: `Rua ${rowId}, Cidade`,
        temperature1: `${20 + (rowId % 6)} C`,
        temperature2: `${21 + (rowId % 6)} C`,
        temperature3: `${22 + (rowId % 6)} C`,
        odometer: `${10000 + rowId} km`,
        hourmeter: `${500 + rowId} h`,
        digitalTemperature1: `${15 + (rowId % 4)} C`,
        digitalTemperature2: `${16 + (rowId % 4)} C`,
        digitalTemperature3: `${17 + (rowId % 4)} C`,
        digitalUnit1: `${rowId % 2}`,
        digitalUnit2: `${(rowId + 1) % 2}`,
        digitalUnit3: `${(rowId + 2) % 2}`,
      };
    });

    const response: PassagensResponse = {
      totalCount: this.totalCount,
      maxCreatedAt: positions.at(-1)?.createdAt ?? payload.pagination.maxCreatedAt,
      Positions: positions,
    };

    return of(response).pipe(delay(3000));
  }

  getAddressByLocations(payload: AddressLookupRequestPayload): Observable<AddressLookupResponse> {
    const firstBlock = payload.LocationList.slice(0, 100);
    const locationList = firstBlock.map((location, offset) => {
      const baseNumber = Number.parseInt(location.id, 10) || location.index + offset + 1;
      return {
        street: `Rua Mock ${baseNumber}`,
        number: String(100 + (baseNumber % 900)),
        bairro: `Bairro ${1 + (baseNumber % 20)}`,
      };
    });

    return of({
      Type: 'MOCK_REVERSE_GEOCODING',
      LocationList: locationList,
    }).pipe(delay(350));
  }
}
