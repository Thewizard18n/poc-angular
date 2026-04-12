import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { catchError, EMPTY, Observable } from 'rxjs';

import {
  PaginationPayload,
  PassagemPosition,
  PassagensColumnConfig,
  PassagensDataColumnId,
  PassagensResponse,
} from '../../features/passagens/passagens.models';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-ui-filter-table',
  imports: [AgGridAngular],
  templateUrl: './ui-filter-table.html',
  styleUrl: './ui-filter-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFilterTable {
  readonly columns = input.required<PassagensColumnConfig[]>();
  readonly fetchRows = input.required<(pagination: PaginationPayload) => Observable<PassagensResponse>>();
  readonly reloadToken = input(0);
  protected readonly cacheBlockSize = 100;
  protected readonly rowSelection = {
    mode: 'multiRow',
    checkboxes: true,
    headerCheckbox: true,
    enableClickSelection: false,
    selectAll: 'all',
  } as const;
  protected readonly defaultColDef: ColDef<PassagemPosition> = {
    sortable: true,
    resizable: true,
    minWidth: 140,
  };
  protected datasource: IDatasource = this.createDatasource();
  protected readonly columnDefs = computed<ColDef<PassagemPosition>[]>(() => {
    const visibility = new Map(this.columns().map((column) => [column.id, column.visible]));
    const allColumns: ColDef<PassagemPosition>[] = [
      { field: 'vehicleDisplay', headerName: 'Veiculo' },
      { field: 'positionDatetime', headerName: 'Data/Hora' },
      { field: 'positionReceivedAt', headerName: 'Data posicao recebida' },
      { field: 'driverName', headerName: 'Motorista' },
      { field: 'speed', headerName: 'Velocidade' },
      { field: 'ignition', headerName: 'Ignicao' },
      { field: 'blocking', headerName: 'Bloqueio' },
      { field: 'battery', headerName: 'Bateria' },
      { field: 'memory', headerName: 'Memoria' },
      { field: 'gps', headerName: 'GPS' },
      { field: 'satellite', headerName: 'Satelite' },
      { field: 'latitudeLongitude', headerName: 'Latitude / Longitude' },
      { field: 'location', headerName: 'Localizacao' },
      { field: 'temperature1', headerName: 'Temperatura 1' },
      { field: 'temperature2', headerName: 'Temperatura 2' },
      { field: 'temperature3', headerName: 'Temperatura 3' },
      { field: 'odometer', headerName: 'Hodometro' },
      { field: 'hourmeter', headerName: 'Horimetro' },
      { field: 'digitalTemperature1', headerName: 'Temperatura digital 1' },
      { field: 'digitalTemperature2', headerName: 'Temperatura digital 2' },
      { field: 'digitalTemperature3', headerName: 'Temperatura digital 3' },
      { field: 'digitalUnit1', headerName: 'Unidade digital 1' },
      { field: 'digitalUnit2', headerName: 'Unidade digital 2' },
      { field: 'digitalUnit3', headerName: 'Unidade digital 3' },
    ];

    return allColumns.map((columnDef) => {
      const columnId = columnDef.field as PassagensDataColumnId;
      return {
        ...columnDef,
        hide: visibility.get(columnId) === false,
      };
    });
  });

  private gridApi?: GridApi<PassagemPosition>;
  private maxCreatedAt = 0;

  constructor() {
    effect(() => {
      this.reloadToken();
      if (this.gridApi) {
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
        const sort = params.sortModel?.[0];
        const pagination: PaginationPayload = {
          maxCreatedAt: this.maxCreatedAt,
          offset: params.startRow,
          limit: Math.max(params.endRow - params.startRow, 1),
          orderColumn: this.toColumnId(sort?.colId),
          orderDirection: sort?.sort === 'asc' ? 'asc' : 'desc',
        };

        this.fetchRows()(
          pagination,
        )
          .pipe(catchError(() => {
            params.failCallback();
            return EMPTY;
          }))
          .subscribe((response) => {
            this.maxCreatedAt = response.maxCreatedAt;
            params.successCallback(response.Positions, response.totalCount);
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
