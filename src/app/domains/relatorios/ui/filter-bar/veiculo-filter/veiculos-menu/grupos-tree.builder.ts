import { Groups, Vehicles } from '../veiculo-filter.models';
import { GrupoTreeNode, GrupoTreeSubgroupNode } from './veiculos-menu.types';

/** O(V×K) — V=vehicles, K=groups per vehicle */
export function buildVehicleCountByGroupId(vehicles: Vehicles[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const v of vehicles) {
    for (const gId of v.groups) {
      map.set(gId, (map.get(gId) ?? 0) + 1);
    }
  }
  return map;
}

/** O(V×K + N) — N=flat grupo entries */
export function buildGruposTree(grupos: Groups[], countByGroupId: Map<number, number>): GrupoTreeNode[] {
  const groupMap = new Map<number, Groups[]>();
  for (const g of grupos) {
    let entries = groupMap.get(g.identifierGroup);
    if (!entries) {
      entries = [];
      groupMap.set(g.identifierGroup, entries);
    }
    entries.push(g);
  }

  const tree: GrupoTreeNode[] = [];
  for (const [identifierGroup, entries] of groupMap) {
    const rootEntry = entries.find((e) => e.identifierSubGroup === -1) ?? entries[0];
    const subgroups: GrupoTreeSubgroupNode[] = [];

    if (entries.length > 1) {
      const seen = new Set<number>();
      for (const entry of entries) {
        if (entry.identifierSubGroup === -1 || !entry.nameSubGroup) continue;
        if (seen.has(entry.identifierSubGroup)) continue;
        seen.add(entry.identifierSubGroup);
        subgroups.push({
          identifierSubGroup: entry.identifierSubGroup,
          nameSubGroup: entry.nameSubGroup,
        });
      }
    }

    let vehicleCount = countByGroupId.get(identifierGroup) ?? 0;
    for (const sg of subgroups) {
      vehicleCount += countByGroupId.get(sg.identifierSubGroup) ?? 0;
    }

    tree.push({ identifierGroup, nameGroup: rootEntry.nameGroup, subgroups, vehicleCount });
  }

  return tree;
}
