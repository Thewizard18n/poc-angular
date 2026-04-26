import { PassagensDataColumnId } from './passagens.models';

export interface PassagensColumnConfigEntry {
  key: PassagensDataColumnId;
  label: string;
  visibility: boolean;
}

export const FIXED_POSITION_DATETIME_COLUMN_KEY: PassagensDataColumnId = 'positionDatetime';

export const PASSAGENS_COLUMNS_CONFIG: ReadonlyArray<PassagensColumnConfigEntry> = [
  { key: 'battery', label: 'TRANSLATE-BATTERY', visibility: true },
  { key: 'blocking', label: 'TRANSLATE-BLOCKING', visibility: true },
  { key: 'digitalTemperature1', label: 'TRANSLATE-DIGITALTEMPERATURE1', visibility: true },
  { key: 'digitalTemperature2', label: 'TRANSLATE-DIGITALTEMPERATURE2', visibility: true },
  { key: 'digitalTemperature3', label: 'TRANSLATE-DIGITALTEMPERATURE3', visibility: true },
  { key: 'digitalUnit1', label: 'TRANSLATE-DIGITALUNIT1', visibility: true },
  { key: 'digitalUnit2', label: 'TRANSLATE-DIGITALUNIT2', visibility: true },
  { key: 'digitalUnit3', label: 'TRANSLATE-DIGITALUNIT3', visibility: true },
  { key: 'driverName', label: 'TRANSLATE-DRIVERNAME', visibility: true },
  { key: 'gps', label: 'TRANSLATE-GPS', visibility: true },
  { key: 'hourmeter', label: 'TRANSLATE-HOURMETER', visibility: true },
  { key: 'ignition', label: 'TRANSLATE-IGNITION', visibility: true },
  { key: 'latitudeLongitude', label: 'TRANSLATE-LATITUDELONGITUDE', visibility: true },
  { key: 'location', label: 'TRANSLATE-LOCATION', visibility: true },
  { key: 'memory', label: 'TRANSLATE-MEMORY', visibility: true },
  { key: 'odometer', label: 'TRANSLATE-ODOMETER', visibility: true },
  { key: 'positionDatetime', label: 'TRANSLATE-POSITIONDATETIME', visibility: true },
  { key: 'positionReceivedAt', label: 'TRANSLATE-POSITIONRECEIVEDAT', visibility: true },
  { key: 'satellite', label: 'TRANSLATE-SATELLITE', visibility: true },
  { key: 'speed', label: 'TRANSLATE-SPEED', visibility: true },
  { key: 'temperature1', label: 'TRANSLATE-TEMPERATURE1', visibility: true },
  { key: 'temperature2', label: 'TRANSLATE-TEMPERATURE2', visibility: true },
  { key: 'temperature3', label: 'TRANSLATE-TEMPERATURE3', visibility: true },
  { key: 'vehicleDisplay', label: 'TRANSLATE-VEHICLEDISPLAY', visibility: true },
];
