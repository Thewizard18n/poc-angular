import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Observable, of } from 'rxjs';

import { DsCard } from '../../../../design-system/ui-primitives/card/ds-card';
import { DsButton } from '../../../../design-system/ui-primitives/button/ds-button';
import { ColunasFilter } from '../../ui/filter-bar/colunas-filter/colunas-filter';
import { HorarioFilter } from '../../ui/filter-bar/horario-filter/horario-filter';
import { PeriodoFilter } from '../../ui/filter-bar/periodo-filter/periodo-filter';
import { VeiculoFilter } from '../../ui/filter-bar/veiculo-filter/veiculo-filter';
import { UiFilterTable } from '../../ui/ui-filter-table/ui-filter-table';
import { UiMapa } from '../../ui/ui-mapa/ui-mapa';
import {
  PaginationPayload,
  PassagensColumnConfig,
  PassagensDataColumnId,
  PassagensFilterPayload,
  PassagensRequestPayload,
  PassagensResponse,
} from './passagens.models';
import { PassagensUsecase } from './passagens-usecase';

@Component({
  selector: 'app-passagens',
  imports: [
    ColunasFilter,
    DsButton,
    DsCard,
    HorarioFilter,
    MatButtonModule,
    MatMenuModule,
    MatSlideToggleModule,
    PeriodoFilter,
    UiFilterTable,
    UiMapa,
    VeiculoFilter,
  ],
  templateUrl: './passagens.html',
  styleUrl: './passagens.scss',
})
export class Passagens {
  protected readonly usecase = inject(PassagensUsecase);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly filtersForm = this.formBuilder.group({
    vehiclesIds: this.formBuilder.control<string[]>([], { validators: [Validators.required] }),
    dateFrom: this.formBuilder.control<Date | null>(null, { validators: [Validators.required] }),
    dateTo: this.formBuilder.control<Date | null>(null, { validators: [Validators.required] }),
    timeFrom: this.formBuilder.control('10:00'),
    timeTo: this.formBuilder.control('00:00'),
  });

  protected readonly mostrarAcoesPosFiltro = signal(false);
  protected readonly gridReloadToken = signal(0);

  protected readonly colunas = signal<PassagensColumnConfig[]>([
    { id: 'vehicleDisplay', label: 'Veiculo', visible: true },
    { id: 'positionDatetime', label: 'Data/Hora', visible: true },
    { id: 'positionReceivedAt', label: 'Data posicao recebida', visible: true },
    { id: 'driverName', label: 'Motorista', visible: true },
    { id: 'speed', label: 'Velocidade', visible: true },
    { id: 'ignition', label: 'Ignicao', visible: true },
    { id: 'blocking', label: 'Bloqueio', visible: true },
    { id: 'battery', label: 'Bateria', visible: true },
    { id: 'memory', label: 'Memoria', visible: true },
    { id: 'gps', label: 'GPS', visible: true },
    { id: 'satellite', label: 'Satelite', visible: true },
    { id: 'latitudeLongitude', label: 'Latitude / Longitude', visible: true },
    { id: 'location', label: 'Localizacao', visible: true },
    { id: 'temperature1', label: 'Temperatura 1', visible: true },
    { id: 'temperature2', label: 'Temperatura 2', visible: true },
    { id: 'temperature3', label: 'Temperatura 3', visible: true },
    { id: 'odometer', label: 'Hodometro', visible: true },
    { id: 'hourmeter', label: 'Horimetro', visible: true },
    { id: 'digitalTemperature1', label: 'Temperatura digital 1', visible: true },
    { id: 'digitalTemperature2', label: 'Temperatura digital 2', visible: true },
    { id: 'digitalTemperature3', label: 'Temperatura digital 3', visible: true },
    { id: 'digitalUnit1', label: 'Unidade digital 1', visible: true },
    { id: 'digitalUnit2', label: 'Unidade digital 2', visible: true },
    { id: 'digitalUnit3', label: 'Unidade digital 3', visible: true },
  ]);

  protected onVeiculoApply(event: { id: string; displayText: string } | null): void {
    this.filtersForm.controls.vehiclesIds.setValue(event ? [event.id] : []);
  }

  protected onPeriodoApply(event: { dateFrom: Date | null; dateTo: Date | null }): void {
    this.filtersForm.controls.dateFrom.setValue(event.dateFrom);
    this.filtersForm.controls.dateTo.setValue(event.dateTo);
  }

  protected onHorarioApply(event: { timeFrom: string; timeTo: string }): void {
    this.filtersForm.controls.timeFrom.setValue(event.timeFrom || '10:00');
    this.filtersForm.controls.timeTo.setValue(event.timeTo || '00:00');
  }

  protected aplicarFiltros(): void {
    if (!this.podeFiltrar()) {
      this.filtersForm.markAllAsTouched();
      return;
    }

    // this.mostrarAcoesPosFiltro.set(true);
    // this.gridReloadToken.update((value) => value + 1);

    console.log(this.filtersForm.getRawValue());
  }

  protected podeFiltrar(): boolean {
    return this.filtersForm.valid;
  }

  protected toggleColuna(colunaId: PassagensDataColumnId): void {
    this.colunas.update((current) =>
      current.map((coluna) => (coluna.id === colunaId ? { ...coluna, visible: !coluna.visible } : coluna)),
    );
  }

  protected onReorderColunas(event: { previousIndex: number; currentIndex: number }): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    this.colunas.update((current) => {
      const reordered = [...current];
      const [moved] = reordered.splice(event.previousIndex, 1);
      reordered.splice(event.currentIndex, 0, moved);
      return reordered;
    });
  }

  protected fetchRows = (pagination: PaginationPayload): Observable<PassagensResponse> => {
    if (!this.podeFiltrar()) {
      return of({
        totalCount: 0,
        maxCreatedAt: 0,
        Positions: [],
      });
    }

    const filter = this.filtersForm.getRawValue() as PassagensFilterPayload;
    const payload: PassagensRequestPayload = {
      filter,
      pagination,
    };
    return this.usecase.getPassagens(payload);
  };

}
