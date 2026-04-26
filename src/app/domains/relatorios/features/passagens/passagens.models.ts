export interface PassagensFilterPayload {
  vehiclesIds: string[];
  /** ISO date only: YYYY-MM-DD */
  dateFrom: string | null;
  /** ISO date only: YYYY-MM-DD */
  dateTo: string | null;
  timeFrom: string;
  timeTo: string;
}

export interface PaginationPayload {
  maxCreatedAt: number;
  offset: number;
  limit: number;
  orderColumn: PassagensDataColumnId;
  orderDirection: PassagensOrderDirection;
}

export interface PassagensRequestPayload {
  filter: PassagensFilterPayload;
  pagination: PaginationPayload;
}

export type PassagensDataColumnId =
  | 'vehicleDisplay'
  | 'positionDatetime'
  | 'positionReceivedAt'
  | 'driverName'
  | 'speed'
  | 'ignition'
  | 'blocking'
  | 'battery'
  | 'memory'
  | 'gps'
  | 'satellite'
  | 'latitudeLongitude'
  | 'location'
  | 'temperature1'
  | 'temperature2'
  | 'temperature3'
  | 'odometer'
  | 'hourmeter'
  | 'digitalTemperature1'
  | 'digitalTemperature2'
  | 'digitalTemperature3'
  | 'digitalUnit1'
  | 'digitalUnit2'
  | 'digitalUnit3';
export type PassagensOrderDirection = 'asc' | 'desc';

export interface PassagemPosition {
  createdAt: number;
  vehicleDisplay: string;
  driverName: string;
  positionDatetime: string;
  positionReceivedAt: string;
  speed: string;
  ignition: string;
  blocking: string;
  battery: string;
  memory: string;
  gps: string;
  satellite: string;
  latitudeLongitude: string;
  latitude: string;
  longitude: string;
  location: string;
  adress?: {
    type: string;
    street: string;
    number: string;
    bairro: string;
  };
  temperature1: string;
  temperature2: string;
  temperature3: string;
  odometer: string;
  hourmeter: string;
  digitalTemperature1: string;
  digitalTemperature2: string;
  digitalTemperature3: string;
  digitalUnit1: string;
  digitalUnit2: string;
  digitalUnit3: string;
}

export interface PassagensResponse {
  totalCount: number;
  maxCreatedAt: number;
  Positions: PassagemPosition[];
}

export interface AddressLookupLocationInput {
  id: string;
  index: number;
  latitude: string;
  longitude: string;
}

export interface AddressLookupRequestPayload {
  LocationList: AddressLookupLocationInput[];
}

export interface AddressLookupLocationResult {
  street: string;
  number: string;
  bairro: string;
}

export interface AddressLookupResponse {
  Type: string;
  LocationList: AddressLookupLocationResult[];
}

export interface PassagensColumnConfig {
  id: PassagensDataColumnId;
  label: string;
  visible: boolean;
}
