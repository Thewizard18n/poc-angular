import { Groups, Vehicles } from '../ui/filter-bar/veiculo-filter/veiculo-filter.models';

export const VEICULO_FILTER_GRUPOS_MOCK: Groups[] = [
  { auto: 1, identifierGroup: 10, identifierSubGroup: -1, nameGroup: 'Logística', nameSubGroup: null },
  { auto: 1, identifierGroup: 20, identifierSubGroup: -1, nameGroup: 'Comercial', nameSubGroup: null },
  { auto: 0, identifierGroup: 30, identifierSubGroup: -1, nameGroup: 'Serviços', nameSubGroup: null },
  { auto: 0, identifierGroup: 30, identifierSubGroup: 301, nameGroup: 'Serviços', nameSubGroup: 'Entregas' },
  { auto: 0, identifierGroup: 30, identifierSubGroup: 302, nameGroup: 'Serviços', nameSubGroup: 'Coletas' },
  { auto: 0, identifierGroup: 30, identifierSubGroup: 303, nameGroup: 'Serviços', nameSubGroup: 'Manutenção Campo' },
  { auto: 1, identifierGroup: 40, identifierSubGroup: -1, nameGroup: 'Transporte', nameSubGroup: null },
  { auto: 1, identifierGroup: 50, identifierSubGroup: -1, nameGroup: 'Administrativo', nameSubGroup: null },
  { auto: 0, identifierGroup: 60, identifierSubGroup: -1, nameGroup: 'Manutenção', nameSubGroup: null },
  { auto: 1, identifierGroup: 70, identifierSubGroup: -1, nameGroup: 'Operacional', nameSubGroup: null },
  { auto: 1, identifierGroup: 80, identifierSubGroup: -1, nameGroup: 'Frota Leve', nameSubGroup: null },
  { auto: 1, identifierGroup: 90, identifierSubGroup: -1, nameGroup: 'Distribuição', nameSubGroup: null },
];

function buildVehicle(
  id: number,
  displayText: string,
  groups: number[],
  groupNames: string[],
  automotive: number,
): Vehicles {
  return {
    allowDoorSensor: id % 2 === 0,
    allowFridgeSensor: id % 5 === 0,
    allowJourneyDriver: id % 3 !== 0,
    allowMapFiltersLevel: (id % 3) + 1,
    allowSensorTab: id % 4 !== 0,
    allowSmartDiagTPMSLocation: id % 7 === 0,
    allowTPMS: id % 6 === 0,
    allowTruckID: id % 2 !== 0,
    automotive,
    displayText,
    financialObligations: [],
    groupNames,
    groups,
    height: +((id % 30) / 10 + 1.5).toFixed(1),
    id,
    idEquipment: 5000 + id,
    identifierAxieLayout: (id % 3) + 1,
    length: +((id % 120) / 10 + 2.0).toFixed(1),
    minimumWeight: 0,
    showAllMapFilters: id % 3 !== 0,
    showSomeMapFilters: true,
    width: +((id % 20) / 10 + 0.8).toFixed(1),
  };
}

function generateGroupVehicles(
  startId: number,
  count: number,
  prefix: string,
  groups: number[],
  groupNames: string[],
  automotive: number,
): Vehicles[] {
  return Array.from({ length: count }, (_, i) =>
    buildVehicle(
      startId + i,
      `${prefix}-${String(i + 1).padStart(3, '0')}`,
      groups,
      groupNames,
      automotive,
    ),
  );
}

export const VEICULO_FILTER_VEHICLES_MOCK: Vehicles[] = [
  // Group 10 - Logística: 40 veículos
  ...generateGroupVehicles(1000, 40, 'LOG', [10], ['Logística'], 1),
  // Group 20 - Comercial: 35 veículos
  ...generateGroupVehicles(2000, 35, 'COM', [20], ['Comercial'], 1),
  // Group 30 - Serviços / Subgroup 301 - Entregas: 4 veículos
  ...generateGroupVehicles(3010, 4, 'SVC-ENT', [30, 301], ['Serviços', 'Entregas'], 0),
  // Group 30 - Serviços / Subgroup 302 - Coletas: 2 veículos
  ...generateGroupVehicles(3020, 2, 'SVC-COL', [30, 302], ['Serviços', 'Coletas'], 0),
  // Group 30 - Serviços / Subgroup 303 - Manutenção Campo: 3 veículos
  ...generateGroupVehicles(3030, 3, 'SVC-MAN', [30, 303], ['Serviços', 'Manutenção Campo'], 0),
  // Group 40 - Transporte: 50 veículos
  ...generateGroupVehicles(4000, 50, 'TRP', [40], ['Transporte'], 1),
  // Group 50 - Administrativo: 30 veículos
  ...generateGroupVehicles(5000, 30, 'ADM', [50], ['Administrativo'], 1),
  // Group 60 - Manutenção: 35 veículos
  ...generateGroupVehicles(6000, 35, 'MNT', [60], ['Manutenção'], 0),
  // Group 70 - Operacional: 45 veículos
  ...generateGroupVehicles(7000, 45, 'OPR', [70], ['Operacional'], 1),
  // Group 80 - Frota Leve: 25 veículos
  ...generateGroupVehicles(8000, 25, 'FLV', [80], ['Frota Leve'], 1),
  // Group 90 - Distribuição: 31 veículos
  ...generateGroupVehicles(9000, 31, 'DST', [90], ['Distribuição'], 1),
];
