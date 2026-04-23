import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, ViewEncapsulation } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  IDatasource,
  IGetRowsParams,
  ModuleRegistry,
  RowClassRules,
} from 'ag-grid-community';
import { catchError, EMPTY, Observable } from 'rxjs';

import {
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
  vehicleDisplay: { field: 'vehicleDisplay', headerName: 'Veiculo', width: 120 },
  positionDatetime: { field: 'positionDatetime', headerName: 'Date & Time', width: 150, sort: 'desc' },
  positionReceivedAt: { field: 'positionReceivedAt', headerName: 'Data posicao recebida', width: 160 },
  driverName: { field: 'driverName', headerName: 'Motorista', width: 130 },
  speed: { field: 'speed', headerName: 'Speed', width: 90 },
  ignition: { field: 'ignition', headerName: 'Ignition', width: 100 },
  blocking: { field: 'blocking', headerName: 'Bloqueio', width: 100 },
  battery: { field: 'battery', headerName: 'Bateria', width: 90 },
  location: {
    field: 'location',
    headerName: 'Location',
    width: 280,
    cellRenderer: locationCellRenderer,
    autoHeight: false,
  },
  hourmeter: { field: 'hourmeter', headerName: 'Hour meter', width: 120 },
  latitudeLongitude: { field: 'latitudeLongitude', headerName: 'Latitude / Longitude', width: 200 },
  satellite: { field: 'satellite', headerName: 'Satellite', width: 90 },
  memory: { field: 'memory', headerName: 'Memory', width: 90 },
  gps: { field: 'gps', headerName: 'GPS', width: 70 },
  temperature1: { field: 'temperature1', headerName: 'Temperatura 1', width: 120 },
  temperature2: { field: 'temperature2', headerName: 'Temperatura 2', width: 120 },
  temperature3: { field: 'temperature3', headerName: 'Temperatura 3', width: 120 },
  odometer: { field: 'odometer', headerName: 'Hodometro', width: 110 },
  digitalTemperature1: { field: 'digitalTemperature1', headerName: 'Temperatura digital 1', width: 160 },
  digitalTemperature2: { field: 'digitalTemperature2', headerName: 'Temperatura digital 2', width: 160 },
  digitalTemperature3: { field: 'digitalTemperature3', headerName: 'Temperatura digital 3', width: 160 },
  digitalUnit1: { field: 'digitalUnit1', headerName: 'Unidade digital 1', width: 150 },
  digitalUnit2: { field: 'digitalUnit2', headerName: 'Unidade digital 2', width: 150 },
  digitalUnit3: { field: 'digitalUnit3', headerName: 'Unidade digital 3', width: 150 },
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
  readonly reloadToken = input(0);

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
    sortable: true,
    resizable: true,
    minWidth: 100,
    suppressMovable: true,
  };

  protected datasource: IDatasource = this.createDatasource();

  protected readonly columnDefs = computed<ColDef<PassagemPosition>[]>(() => {
    const checkboxCol: ColDef<PassagemPosition> = {
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
      suppressHeaderMenuButton: true,
    };

    const orderedDataColumns: ColDef<PassagemPosition>[] = [];
    for (const config of this.columns()) {
      const baseDef = COLUMN_DEF_REGISTRY[config.id];
      if (baseDef) {
        orderedDataColumns.push({ ...baseDef, hide: !config.visible });
      }
    }

    const actionCol: ColDef<PassagemPosition> = {
      headerName: '',
      width: 52,
      maxWidth: 52,
      minWidth: 52,
      cellRenderer: ActionCellRenderer,
      sortable: false,
      resizable: false,
      pinned: 'right',
      lockPosition: true,
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
            catchError(() => {
              params.failCallback();
              return EMPTY;
            }),
          )
          .subscribe((response) => {
            this.maxCreatedAt = response.maxCreatedAt;
            params.successCallback(response.Positions, response.totalCount);

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

  private toColumnId(columnId?: string): PassagensDataColumnId {
    const fallback: PassagensDataColumnId = 'positionDatetime';
    if (!columnId) {
      return fallback;
    }

    const validIds = new Set(this.columns().map((column) => column.id));
    return validIds.has(columnId as PassagensDataColumnId)
      ? (columnId as PassagensDataColumnId)
      : fallback;
  }
}
