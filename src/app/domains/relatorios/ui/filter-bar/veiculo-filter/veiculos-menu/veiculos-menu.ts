import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { VeiculoFilterGrupoModel, VeiculoFilterVehicleModel } from '../veiculo-filter.models';

export interface VeiculosMenuCheckboxChangeEvent {
  id: string;
  checked: boolean;
}

export interface VeiculosMenuApplyEvent {
  id: number;
  displayText: string;
}

interface GrupoTreeNode {
  identifierGroup: number;
  nameGroup: string;
  subgroups: GrupoTreeSubgroupNode[];
  vehicleCount: number;
}

interface GrupoTreeSubgroupNode {
  identifierSubGroup: number;
  nameSubGroup: string;
}

@Component({
  selector: 'app-veiculos-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  templateUrl: './veiculos-menu.html',
  styleUrl: './veiculos-menu.scss',
})
export class VeiculosMenu {
  readonly grupos = input.required<VeiculoFilterGrupoModel[]>();
  readonly allVeiculos = input.required<VeiculoFilterVehicleModel[]>();
  readonly veiculos = input.required<VeiculoFilterVehicleModel[]>();
  readonly automotorChecked = input(true);
  readonly naoAutomotorChecked = input(true);

  readonly tipoToggleChange = output<{ toggleId: number; checked: boolean }>();
  readonly searchChange = output<{ source: 'grupos' | 'veiculos'; value: string }>();
  readonly checkboxChange = output<VeiculosMenuCheckboxChangeEvent>();
  readonly cancelarClick = output<void>();
  readonly applyClick = output<VeiculosMenuApplyEvent | null>();

  private readonly expandedGroupIds = signal<Set<number>>(new Set());
  private readonly selectedGroupIds = signal<Set<number>>(new Set());
  private readonly selectedSubGroupKeys = signal<Set<string>>(new Set());
  private readonly selectedVeiculoId = signal<number | null>(null);
  private expandedInitialized = false;

  protected readonly veiculosHabilitados = computed(
    () => this.selectedGroupIds().size > 0 || this.selectedSubGroupKeys().size > 0,
  );

  protected readonly selectedVeiculoCount = computed(() => (this.selectedVeiculoId() ? 1 : 0));

  constructor() {
    effect(() => {
      const tree = this.gruposTree();
      if (this.expandedInitialized || tree.length === 0) return;
      this.expandedInitialized = true;
      this.expandedGroupIds.set(
        new Set(tree.filter((g) => g.subgroups.length > 0).map((g) => g.identifierGroup)),
      );
    });
  }

  // O(V*K + N) — V=vehicles, K=avg groups/vehicle, N=flat grupo entries
  protected readonly gruposTree = computed<GrupoTreeNode[]>(() => {
    const grupos = this.grupos();
    const allVeiculos = this.allVeiculos();

    const countByGroupId = new Map<number, number>();
    for (const v of allVeiculos) {
      for (const gId of v.groups) {
        countByGroupId.set(gId, (countByGroupId.get(gId) ?? 0) + 1);
      }
    }

    const groupMap = new Map<number, VeiculoFilterGrupoModel[]>();
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
  });

  // O(V*K) — precomputed map for filtered vehicle counts
  private readonly filteredVehicleCountMap = computed(() => {
    const map = new Map<number, number>();
    for (const v of this.veiculos()) {
      for (const gId of v.groups) {
        map.set(gId, (map.get(gId) ?? 0) + 1);
      }
    }
    return map;
  });

  protected readonly allGroupsChecked = computed(() => {
    const tree = this.gruposTree();
    return tree.length > 0 && tree.every((g) => this.isGroupChecked(g));
  });

  protected readonly allGroupsIndeterminate = computed(() => {
    if (this.allGroupsChecked()) return false;
    return this.gruposTree().some((g) => this.isGroupChecked(g) || this.isGroupIndeterminate(g));
  });

  protected isExpanded(id: number): boolean {
    return this.expandedGroupIds().has(id);
  }

  protected toggleExpand(id: number): void {
    this.expandedGroupIds.update((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected hasSubgroups(group: GrupoTreeNode): boolean {
    return group.subgroups.length > 0;
  }

  protected getGroupChevron(group: GrupoTreeNode): string {
    if (!this.hasSubgroups(group)) return 'chevron_right';
    return this.isExpanded(group.identifierGroup) ? 'expand_more' : 'chevron_right';
  }

  protected isGroupChecked(group: GrupoTreeNode): boolean {
    if (!this.hasSubgroups(group)) {
      return this.selectedGroupIds().has(group.identifierGroup);
    }
    const keys = this.selectedSubGroupKeys();
    return group.subgroups.every((sg) =>
      keys.has(this.buildKey(group.identifierGroup, sg.identifierSubGroup)),
    );
  }

  protected isGroupIndeterminate(group: GrupoTreeNode): boolean {
    if (!this.hasSubgroups(group)) return false;
    const keys = this.selectedSubGroupKeys();
    let count = 0;
    for (const sg of group.subgroups) {
      if (keys.has(this.buildKey(group.identifierGroup, sg.identifierSubGroup))) count++;
    }
    return count > 0 && count < group.subgroups.length;
  }

  protected isSubGroupChecked(groupId: number, subGroupId: number): boolean {
    return this.selectedSubGroupKeys().has(this.buildKey(groupId, subGroupId));
  }

  protected isVeiculoSelected(id: number): boolean {
    return this.selectedVeiculoId() === id;
  }

  protected getSelectedVehicleCount(group: GrupoTreeNode): number {
    const map = this.filteredVehicleCountMap();
    let count = map.get(group.identifierGroup) ?? 0;
    for (const sg of group.subgroups) {
      count += map.get(sg.identifierSubGroup) ?? 0;
    }
    return count;
  }

  onToggleChange(toggleId: number, checked: boolean): void {
    this.tipoToggleChange.emit({ toggleId, checked });
  }

  onGrupoSearch(event: Event): void {
    this.searchChange.emit({ source: 'grupos', value: (event.target as HTMLInputElement).value });
  }

  onVeiculoSearch(event: Event): void {
    this.searchChange.emit({ source: 'veiculos', value: (event.target as HTMLInputElement).value });
  }

  onSelectAllGrupos(event: MatCheckboxChange): void {
    const tree = this.gruposTree();

    if (event.checked) {
      this.selectedGroupIds.set(new Set(tree.map((g) => g.identifierGroup)));
      this.selectedSubGroupKeys.set(
        new Set(
          tree.flatMap((g) =>
            g.subgroups.map((sg) => this.buildKey(g.identifierGroup, sg.identifierSubGroup)),
          ),
        ),
      );
    } else {
      this.selectedGroupIds.set(new Set());
      this.selectedSubGroupKeys.set(new Set());
    }

    for (const g of tree) {
      this.checkboxChange.emit({ id: g.identifierGroup.toString(), checked: event.checked });
    }
  }

  onGrupoCheckbox(event: MatCheckboxChange, groupId: number): void {
    const group = this.gruposTree().find((g) => g.identifierGroup === groupId);

    if (group?.subgroups.length) {
      this.selectedSubGroupKeys.update((current) => {
        const next = new Set(current);
        for (const sg of group.subgroups) {
          const key = this.buildKey(groupId, sg.identifierSubGroup);
          event.checked ? next.add(key) : next.delete(key);
        }
        return next;
      });
    }

    this.selectedGroupIds.update((current) => {
      const next = new Set(current);
      event.checked ? next.add(groupId) : next.delete(groupId);
      return next;
    });

    this.checkboxChange.emit({ id: groupId.toString(), checked: event.checked });
  }

  onSubGrupoCheckbox(event: MatCheckboxChange, groupId: number, subGroupId: number): void {
    const key = this.buildKey(groupId, subGroupId);
    this.selectedSubGroupKeys.update((current) => {
      const next = new Set(current);
      event.checked ? next.add(key) : next.delete(key);
      return next;
    });

    const group = this.gruposTree().find((g) => g.identifierGroup === groupId);
    if (group?.subgroups.length) {
      const allChecked = group.subgroups.every((sg) =>
        sg.identifierSubGroup === subGroupId
          ? event.checked
          : this.selectedSubGroupKeys().has(this.buildKey(groupId, sg.identifierSubGroup)),
      );

      this.selectedGroupIds.update((current) => {
        const next = new Set(current);
        allChecked ? next.add(groupId) : next.delete(groupId);
        return next;
      });
    }

    this.checkboxChange.emit({ id: `${groupId}:${subGroupId}`, checked: event.checked });
  }

  protected onVeiculoSelect(veiculo: VeiculoFilterVehicleModel): void {
    const current = this.selectedVeiculoId();
    this.selectedVeiculoId.set(current === veiculo.id ? null : veiculo.id);
  }

  onApply(): void {
    const id = this.selectedVeiculoId();
    if (!id) {
      this.applyClick.emit(null);
      return;
    }
    const veiculo = this.veiculos().find((v) => v.id === id);
    this.applyClick.emit(veiculo ? { id: veiculo.id, displayText: veiculo.displayText } : null);
  }

  onCancelar(): void {
    this.cancelarClick.emit();
  }

  private buildKey(groupId: number, subGroupId: number): string {
    return `${groupId}:${subGroupId}`;
  }
}
