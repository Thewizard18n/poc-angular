export interface VeiculosMenuCheckboxChangeEvent {
  id: string;
  checked: boolean;
}

export interface VeiculosMenuApplyEvent {
  id: number;
  displayText: string;
}

export interface GrupoTreeSubgroupNode {
  identifierSubGroup: number;
  nameSubGroup: string;
}

export interface GrupoTreeNode {
  identifierGroup: number;
  nameGroup: string;
  subgroups: GrupoTreeSubgroupNode[];
  vehicleCount: number;
}
