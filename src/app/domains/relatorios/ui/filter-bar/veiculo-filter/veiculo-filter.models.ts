export interface VeiculoFilterGrupoModel {
  auto: number;
  identifierGroup: number;
  identifierSubGroup: number;
  nameGroup: string;
  nameSubGroup: string | null;
}

export interface VeiculoFilterVehicleModel {
  allowDoorSensor: boolean;
  allowFridgeSensor: boolean;
  allowJourneyDriver: boolean;
  allowMapFiltersLevel: number;
  allowSensorTab: boolean;
  allowSmartDiagTPMSLocation: boolean;
  allowTPMS: boolean;
  allowTruckID: boolean;
  automotive: number;
  displayText: string;
  financialObligations: string[];
  groupNames: string[];
  groups: number[];
  height: number;
  id: number;
  idEquipment: number;
  identifierAxieLayout: number;
  length: number;
  minimumWeight: number;
  showAllMapFilters: boolean;
  showSomeMapFilters: boolean;
  width: number;
}
