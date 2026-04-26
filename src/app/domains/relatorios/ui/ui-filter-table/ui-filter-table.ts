import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, output, ViewEncapsulation } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColumnMovedEvent,
  ColDef,
  ColGroupDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  IDatasource,
  IGetRowsParams,
  ModuleRegistry,
  RowClassRules,
} from 'ag-grid-community';
import { catchError, EMPTY, map, Observable, switchMap } from 'rxjs';

import { FIXED_POSITION_DATETIME_COLUMN_KEY } from '../../features/passagens/passagens-columns.config';
import {
  AddressLookupRequestPayload,
  AddressLookupResponse,
  PaginationPayload,
  PassagemPosition,
  PassagensColumnConfig,
  PassagensDataColumnId,
  PassagensResponse,
} from '../../features/passagens/passagens.models';
import { ActionCellRenderer } from './action-cell';
import { CheckboxCellRenderer } from './checkbox-cell';
import { CheckboxHeaderRenderer } from './checkbox-header';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface TableGridContext {
  selectAllActive: boolean;
  highlightedRowId: string | null;
}

function locationCellRenderer(params: ICellRendererParams<PassagemPosition>): string {
  const raw = params.value as string | undefined;
  if (!raw) return '';

  const newlineIdx = raw.indexOf('\n');
  if (newlineIdx > -1) {
    const title = raw.substring(0, newlineIdx);
    const address = raw.substring(newlineIdx + 1);
    return `<div class="location-cell">
      <span class="location-cell__title">${title}</span>
      <span class="location-cell__address">${address}</span>
    </div>`;
  }

  const separatorIdx = raw.indexOf(' - ');
  if (separatorIdx > 20) {
    const title = raw.substring(0, separatorIdx);
    const address = raw.substring(separatorIdx + 3);
    return `<div class="location-cell">
      <span class="location-cell__title">${title}</span>
      <span class="location-cell__address">${address}</span>
    </div>`;
  }

  return `<div class="location-cell">
    <span class="location-cell__title">${raw}</span>
  </div>`;
}

const COLUMN_DEF_REGISTRY: Record<string, ColDef<PassagemPosition>> = {
  vehicleDisplay: { field: 'vehicleDisplay', width: 120 },
  positionDatetime: {
    field: 'positionDatetime',
    width: 150,
    sortable: true,
    sort: 'desc',
    sortingOrder: ['desc', 'asc'],
    suppressMovable: true,
    lockPosition: 'left',
  },
  positionReceivedAt: { field: 'positionReceivedAt', width: 160 },
  driverName: { field: 'driverName', width: 130 },
  speed: { field: 'speed', width: 90 },
  ignition: { field: 'ignition', width: 100 },
  blocking: { field: 'blocking', width: 100 },
  battery: { field: 'battery', width: 90 },
  location: {
    field: 'location',
    width: 280,
    cellRenderer: locationCellRenderer,
    autoHeight: false,
  },
  hourmeter: { field: 'hourmeter', width: 120 },
  latitudeLongitude: { field: 'latitudeLongitude', width: 200 },
  satellite: { field: 'satellite', width: 90 },
  memory: { field: 'memory', width: 90 },
  gps: { field: 'gps', width: 70 },
  temperature1: { field: 'temperature1', width: 120 },
  temperature2: { field: 'temperature2', width: 120 },
  temperature3: { field: 'temperature3', width: 120 },
  odometer: { field: 'odometer', width: 110 },
  digitalTemperature1: { field: 'digitalTemperature1', width: 160 },
  digitalTemperature2: { field: 'digitalTemperature2', width: 160 },
  digitalTemperature3: { field: 'digitalTemperature3', width: 160 },
  digitalUnit1: { field: 'digitalUnit1', width: 150 },
  digitalUnit2: { field: 'digitalUnit2', width: 150 },
  digitalUnit3: { field: 'digitalUnit3', width: 150 },
};

@Component({
  selector: 'app-ui-filter-table',
  imports: [AgGridAngular],
  templateUrl: './ui-filter-table.html',
  styleUrl: './ui-filter-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class UiFilterTable {
  private readonly el = inject(ElementRef);

  readonly columns = input.required<PassagensColumnConfig[]>();
  readonly fetchRows = input.required<(pagination: PaginationPayload) => Observable<PassagensResponse>>();
  readonly fetchAddressByLocations = input.required<
    (payload: AddressLookupRequestPayload) => Observable<AddressLookupResponse>
  >();
  readonly reloadToken = input(0);
  readonly emptyResult = output<boolean>();
  readonly columnsOrderChange = output<PassagensDataColumnId[]>();

  protected readonly cacheBlockSize = 100;
  protected readonly rowHeight = 56;
  protected readonly headerHeight = 44;

  protected readonly gridContext: TableGridContext = { selectAllActive: false, highlightedRowId: null };

  protected readonly rowSelection = {
    mode: 'multiRow',
    checkboxes: false,
    headerCheckbox: false,
    enableClickSelection: false,
  } as const;

  protected readonly rowClassRules: RowClassRules<PassagemPosition> = {
    'action-active-row': (params) => (params.context as TableGridContext).highlightedRowId === params.node.id,
  };

  protected readonly defaultColDef: ColDef<PassagemPosition> = {
    sortable: false,
    resizable: true,
    minWidth: 100,
    suppressMovable: false,
    lockPinned: true,
  };

  protected datasource: IDatasource = this.createDatasource();

  protected readonly columnDefs = computed<ColDef<PassagemPosition>[]>(() => {
    const checkboxCol: ColDef<PassagemPosition> = {
      colId: '__checkbox',
      headerName: '',
      width: 52,
      maxWidth: 52,
      minWidth: 52,
      headerComponent: CheckboxHeaderRenderer,
      cellRenderer: CheckboxCellRenderer,
      sortable: false,
      resizable: false,
      pinned: 'left',
      lockPosition: true,
      suppressMovable: true,
      lockPinned: true,
      suppressHeaderMenuButton: true,
    };

    const orderedDataColumns: ColDef<PassagemPosition>[] = [];
    for (const config of this.columns()) {
      const baseDef = COLUMN_DEF_REGISTRY[config.key];
      if (baseDef) {
        orderedDataColumns.push({
          ...baseDef,
          colId: config.key,
          headerName: config.label,
          hide: !config.visibility,
        });
      }
    }

    const actionCol: ColDef<PassagemPosition> = {
      colId: '__action',
      headerName: '',
      width: 52,
      maxWidth: 52,
      minWidth: 52,
      cellRenderer: ActionCellRenderer,
      sortable: false,
      resizable: false,
      pinned: 'right',
      lockPosition: true,
      suppressMovable: true,
      lockPinned: true,
      suppressHeaderMenuButton: true,
    };

    return [checkboxCol, ...orderedDataColumns, actionCol];
  });
  private gridApi?: GridApi<PassagemPosition>;
  private maxCreatedAt = 0;

  constructor() {
    effect(() => {
      this.reloadToken();
      if (this.gridApi) {
        this.gridContext.selectAllActive = false;
        this.gridContext.highlightedRowId = null;
        this.el.nativeElement.querySelector('.table-grid')?.classList.remove('has-active-action');
        this.resetDatasource();
      }
    });
  }

  onGridReady(event: GridReadyEvent<PassagemPosition>): void {
    this.gridApi = event.api;
    this.resetDatasource();
  }

  private createDatasource(): IDatasource {
    return {
      getRows: (params: IGetRowsParams) => {
        if (params.startRow === 0) {
          this.maxCreatedAt = 0;
        }

        const sort = params.sortModel?.[0];
        const pagination: PaginationPayload = {
          maxCreatedAt: this.maxCreatedAt,
          offset: params.startRow,
          limit: Math.max(params.endRow - params.startRow, 1),
          orderColumn: this.toColumnId(sort?.colId),
          orderDirection: sort?.sort === 'asc' ? 'asc' : 'desc',
        };

        this.fetchRows()(pagination)
          .pipe(
            switchMap((response) =>
              this.fetchAddressByLocations()(this.toAddressLookupPayload(response.Positions)).pipe(
                map((addressResponse) => this.applyAddressToPositions(response, addressResponse)),
              ),
            ),
            catchError(() => {
              params.failCallback();
              return EMPTY;
            }),
          )
          .subscribe((response) => {
            this.maxCreatedAt = response.maxCreatedAt;
            params.successCallback(response.Positions, response.totalCount);

            if (params.startRow === 0) {
              this.emptyResult.emit(response.totalCount === 0);
            }

            if (this.gridContext.selectAllActive) {
              this.gridApi?.forEachNode((node) => {
                if (node.data && !node.isSelected()) {
                  node.setSelected(true);
                }
              });
              this.gridApi?.refreshCells({ force: true });
            }
          });
      },
    };
  }

  private resetDatasource(): void {
    this.maxCreatedAt = 0;
    this.datasource = this.createDatasource();
    this.gridApi?.setGridOption('datasource', this.datasource);
  }

  onColumnMoved(event: ColumnMovedEvent<PassagemPosition>): void {
    if (event.finished !== true) {
      return;
    }

    const columnOrder = this.readCurrentDataColumnOrder();
    if (!columnOrder.length) {
      return;
    }

    this.columnsOrderChange.emit(this.ensureFixedDatetimeFirst(columnOrder));
  }

  private toColumnId(columnId?: string): PassagensDataColumnId {
    const fallback: PassagensDataColumnId = 'positionDatetime';
    if (!columnId) {
      return fallback;
    }

    const validIds = new Set(this.columns().map((column) => column.key));
    return validIds.has(columnId as PassagensDataColumnId)
      ? (columnId as PassagensDataColumnId)
      : fallback;
  }

  private readCurrentDataColumnOrder(): PassagensDataColumnId[] {
    const columnDefs = this.gridApi?.getColumnDefs() ?? [];
    return columnDefs
      .map((columnDef) => this.extractColId(columnDef))
      .filter((colId): colId is PassagensDataColumnId => this.isDataColumnId(colId));
  }

  private extractColId(columnDef: ColDef<PassagemPosition> | ColGroupDef<PassagemPosition>): string | undefined {
    if ('colId' in columnDef && columnDef.colId) {
      return columnDef.colId;
    }
    if ('field' in columnDef && typeof columnDef.field === 'string') {
      return columnDef.field;
    }
    return undefined;
  }

  private isDataColumnId(colId: string | undefined): colId is PassagensDataColumnId {
    if (!colId) {
      return false;
    }
    return this.columns().some((column) => column.key === colId);
  }

  private ensureFixedDatetimeFirst(order: PassagensDataColumnId[]): PassagensDataColumnId[] {
    const fixedKey = FIXED_POSITION_DATETIME_COLUMN_KEY;
    const remaining = order.filter((columnKey) => columnKey !== fixedKey);
    return [fixedKey, ...remaining];
  }

  private toAddressLookupPayload(positions: PassagemPosition[]): AddressLookupRequestPayload {
    return {
      LocationList: positions.map((position, index) => ({
        id: String(position.createdAt),
        index,
        latitude: position.latitude,
        longitude: position.longitude,
      })),
    };
  }

  private applyAddressToPositions(
    response: PassagensResponse,
    addressResponse: AddressLookupResponse,
  ): PassagensResponse {
    const mappedPositions = response.Positions.map((position, index) => {
      const address = addressResponse.LocationList[index];
      if (!address) {
        return position;
      }

      return {
        ...position,
        adress: {
          type: addressResponse.Type,
          street: address.street,
          number: address.number,
          bairro: address.bairro,
        },
      };
    });

    return {
      ...response,
      Positions: mappedPositions,
    };
  }
}
