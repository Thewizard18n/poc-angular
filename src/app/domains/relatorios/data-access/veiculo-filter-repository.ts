import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { VeiculoFilterGrupoModel, VeiculoFilterVehicleModel } from '../ui/filter-bar/veiculo-filter/veiculo-filter.models';

import { VEICULO_FILTER_GRUPOS_MOCK, VEICULO_FILTER_VEHICLES_MOCK } from './veiculo-filter-data-access.mock';

@Injectable({ providedIn: 'root' })
export class VeiculoFilterRepository {
  getGrupos(): Observable<VeiculoFilterGrupoModel[]> {
    return of(VEICULO_FILTER_GRUPOS_MOCK).pipe(delay(200));
  }

  getVehicles(): Observable<VeiculoFilterVehicleModel[]> {
    return of(VEICULO_FILTER_VEHICLES_MOCK).pipe(delay(200));
  }
}


// pegar contrato de veiculo
// allowDoorSensor:boolean
// allowFridgeSensor:boolean
// allowJourneyDriver:boolean
// allowMapFiltersLevel:number
// allowSensorTab:boolean
// allowSmartDiagTPMSLocation:boolean
// allowTPMS:boolean
// allowTruckID:boolean
// automotive:number
// displayText:string
// financialObligations:[string]
// groupNames: [string]
// groups: [number]
// height:number
// id:number
// idEquipment:number
// identifierAxieLayout:number
// length:number
// minimumWeight:number
// showAllMapFilters:boolean
// showSomeMapFilters:boolean
// width:number

// mesma estrutura header e payload

// na label do veiculo exibir o displayText

// dentro de groups tem o id do grupo do veiculo quando so tem 1
// subgrupo eh o id do subgrupo dentro do groups

