import { NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateService } from '@ngx-translate/core';
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
  FIXED_POSITION_DATETIME_COLUMN_KEY,
  PASSAGENS_COLUMNS_CONFIG,
  PassagensColumnConfigEntry,
} from './passagens-columns.config';
import {
  AddressLookupRequestPayload,
  AddressLookupResponse,
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
    NgOptimizedImage,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
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
  private readonly translate = inject(TranslateService);
  private readonly languageStorageKey = 'language';
  private readonly fallbackLanguage = 'pt-BR';

  protected readonly filtersForm = this.formBuilder.group({
    vehiclesIds: this.formBuilder.control<string[]>([], { validators: [Validators.required] }),
    dateFrom: this.formBuilder.control<string | null>(null, { validators: [Validators.required] }),
    dateTo: this.formBuilder.control<string | null>(null, { validators: [Validators.required] }),
    timeFrom: this.formBuilder.control('10:00'),
    timeTo: this.formBuilder.control('00:00'),
  });

  protected readonly viewState = signal<'idle' | 'loading' | 'empty' | 'data'>('idle');
  protected readonly gridReloadToken = signal(0);
  protected readonly fixedColumnKey = FIXED_POSITION_DATETIME_COLUMN_KEY;
  protected readonly colunas = signal<PassagensColumnConfig[]>(this.buildInitialColumns());

  protected onVeiculoApply(event: { id: number } | null): void {
    this.filtersForm.controls.vehiclesIds.setValue(event ? [event.id.toString()] : []);
  }

  protected onPeriodoApply(event: { dateFrom: string | null; dateTo: string | null }): void {
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

    this.viewState.set('loading');
    this.gridReloadToken.update((value) => value + 1);
  }

  protected onResultado(vazio: boolean): void {
    this.viewState.set(vazio ? 'empty' : 'data');
  }

  protected podeFiltrar(): boolean {
    return this.filtersForm.valid;
  }

  protected toggleColuna(colunaId: PassagensDataColumnId): void {
    this.colunas.update((current) =>
      current.map((coluna) =>
        coluna.key === colunaId ? { ...coluna, visibility: !coluna.visibility } : coluna,
      ),
    );
  }

  protected onReorderColunas(event: { previousIndex: number; currentIndex: number }): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    this.colunas.update((current) => {
      const reordered = [...current];
      const [moved] = reordered.splice(event.previousIndex, 1);
      if (!moved || moved.key === this.fixedColumnKey) {
        return current;
      }
      reordered.splice(event.currentIndex, 0, moved);
      return this.withFixedColumnFirst(reordered);
    });
  }

  protected onGridColumnsOrderChange(order: PassagensDataColumnId[]): void {
    this.colunas.update((current) => {
      const byKey = new Map(current.map((column) => [column.key, column]));
      const reordered = order
        .map((key) => byKey.get(key))
        .filter((column): column is PassagensColumnConfig => Boolean(column));
      const missing = current.filter((column) => !order.includes(column.key));
      return this.withFixedColumnFirst([...reordered, ...missing]);
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

    const raw = this.filtersForm.getRawValue();
    const filter: PassagensFilterPayload = {
      vehiclesIds: raw.vehiclesIds ?? [],
      dateFrom: raw.dateFrom,
      dateTo: raw.dateTo,
      timeFrom: raw.timeFrom ?? '10:00',
      timeTo: raw.timeTo ?? '00:00',
    };
    const payload: PassagensRequestPayload = {
      filter,
      pagination,
    };
    return this.usecase.getPassagens(payload);
  };

  protected fetchAddressByLocations = (payload: AddressLookupRequestPayload): Observable<AddressLookupResponse> => {
    return this.usecase.getAddressByLocations(payload);
  };

  private buildInitialColumns(): PassagensColumnConfig[] {
    const locale = this.getSelectedLanguage();
    const collator = new Intl.Collator(locale, { sensitivity: 'base' });
    const baseColumns = [...PASSAGENS_COLUMNS_CONFIG].map((column) => ({
      ...column,
      label: this.translate.instant(column.label),
    }));
    const fixedColumn = baseColumns.find((column) => column.key === this.fixedColumnKey);
    const sortableColumns = baseColumns
      .filter((column) => column.key !== this.fixedColumnKey)
      .sort((left, right) => collator.compare(left.label, right.label));

    return fixedColumn ? [fixedColumn, ...sortableColumns] : sortableColumns;
  }

  private getSelectedLanguage(): string {
    return sessionStorage.getItem(this.languageStorageKey) ?? this.translate.currentLang ?? this.fallbackLanguage;
  }

  private withFixedColumnFirst(columns: PassagensColumnConfigEntry[]): PassagensColumnConfig[] {
    const fixedColumn = columns.find((column) => column.key === this.fixedColumnKey);
    const remaining = columns.filter((column) => column.key !== this.fixedColumnKey);
    return fixedColumn ? [fixedColumn, ...remaining] : remaining;
  }
}
