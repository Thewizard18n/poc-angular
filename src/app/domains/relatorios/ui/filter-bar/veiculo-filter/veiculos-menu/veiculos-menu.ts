import { Component, computed, effect, input, output, signal } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Groups, Vehicles } from '../veiculo-filter.models';
import { buildGruposTree, buildVehicleCountByGroupId } from './grupos-tree.builder';
import type { GrupoTreeNode, VeiculosMenuApplyEvent, VeiculosMenuCheckboxChangeEvent } from './veiculos-menu.types';

export type { VeiculosMenuApplyEvent, VeiculosMenuCheckboxChangeEvent } from './veiculos-menu.types';

@Component({
  selector: 'app-veiculos-menu',
  standalone: true,
  imports: [MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSlideToggleModule],
  templateUrl: './veiculos-menu.html',
  styleUrl: './veiculos-menu.scss',
})
export class VeiculosMenu {
  readonly grupos = input.required<Groups[]>();
  readonly allVehiclesPerGroup = input.required<Vehicles[]>();
  readonly filteredVehiclesPerGroup = input.required<Vehicles[]>();
  readonly automotorChecked = input(true);
  readonly naoAutomotorChecked = input(true);

  readonly filterByType = output<{ toggleId: number; checked: boolean }>();
  readonly filterBySearch = output<{ source: 'grupos' | 'veiculos'; value: string }>();
  readonly selectGroup = output<VeiculosMenuCheckboxChangeEvent>();
  readonly closeMenu = output<void>();
  readonly selectVehicle = output<VeiculosMenuApplyEvent | null>();

  private readonly expandedGroupIds = signal<Set<number>>(new Set());
  private readonly selectedGroupIds = signal<Set<number>>(new Set());
  private readonly selectedSubgroupKeys = signal<Set<string>>(new Set());
  private readonly selectedVehicleId = signal<number | null>(null);
  private hasInitializedExpandedGroups = false;

  protected readonly gruposTree = computed(() =>
    buildGruposTree(this.grupos(), buildVehicleCountByGroupId(this.allVehiclesPerGroup())),
  );

  protected readonly filteredVehicleCountMap = computed(() =>
    buildVehicleCountByGroupId(this.filteredVehiclesPerGroup()),
  );

  protected readonly vehiclesEnabled = computed(
    () => this.selectedGroupIds().size > 0 || this.selectedSubgroupKeys().size > 0,
  );

  protected readonly allGroupsChecked = computed(() => {
    const tree = this.gruposTree();
    return tree.length > 0 && tree.every((group) => this.isGroupChecked(group));
  });

  protected readonly allGroupsIndeterminate = computed(() => {
    const tree = this.gruposTree();
    if (!tree.length || this.allGroupsChecked()) return false;
    return tree.some((group) => this.isGroupChecked(group) || this.isGroupIndeterminate(group));
  });

  protected readonly selectedVehicleCount = computed(() => (this.selectedVehicleId() ? 1 : 0));

  constructor() {
    effect(() => {
      const tree = this.gruposTree();
      if (this.hasInitializedExpandedGroups || tree.length === 0) return;
      this.hasInitializedExpandedGroups = true;
      this.expandedGroupIds.set(
        new Set(tree.filter((group) => group.subgroups.length > 0).map((group) => group.identifierGroup)),
      );
    });
  }

  protected updateVehicleTypeFilter(toggleId: number, checked: boolean): void {
    this.filterByType.emit({ toggleId, checked });
  }

  protected filterGroupsBySearch(event: Event): void {
    this.filterBySearch.emit({ source: 'grupos', value: (event.target as HTMLInputElement).value });
  }

  protected filterVehiclesBySearch(event: Event): void {
    this.filterBySearch.emit({ source: 'veiculos', value: (event.target as HTMLInputElement).value });
  }

  protected toggleAllGroupsSelection(event: MatCheckboxChange): void {
    const tree = this.gruposTree();
    if (event.checked) {
      this.selectedGroupIds.set(new Set(tree.map((group) => group.identifierGroup)));
      this.selectedSubgroupKeys.set(
        new Set(
          tree.flatMap((group) =>
            group.subgroups.map((subgroup) =>
              this.buildSubgroupKey(group.identifierGroup, subgroup.identifierSubGroup),
            ),
          ),
        ),
      );
    } else {
      this.selectedGroupIds.set(new Set());
      this.selectedSubgroupKeys.set(new Set());
    }

    for (const group of tree) {
      this.selectGroup.emit({ id: group.identifierGroup.toString(), checked: event.checked });
    }
  }

  protected toggleGroupSelection(event: MatCheckboxChange, groupId: number): void {
    const tree = this.gruposTree();
    const group = tree.find((item) => item.identifierGroup === groupId);

    if (group?.subgroups.length) {
      this.selectedSubgroupKeys.update((current) => {
        const next = new Set(current);
        for (const subgroup of group.subgroups) {
          const key = this.buildSubgroupKey(groupId, subgroup.identifierSubGroup);
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

    this.selectGroup.emit({ id: groupId.toString(), checked: event.checked });
  }

  protected toggleSubgroupSelection(event: MatCheckboxChange, groupId: number, subGroupId: number): void {
    const tree = this.gruposTree();
    const key = this.buildSubgroupKey(groupId, subGroupId);
    this.selectedSubgroupKeys.update((current) => {
      const next = new Set(current);
      event.checked ? next.add(key) : next.delete(key);
      return next;
    });

    const group = tree.find((item) => item.identifierGroup === groupId);
    if (group?.subgroups.length) {
      const allChecked = group.subgroups.every((subgroup) =>
        subgroup.identifierSubGroup === subGroupId
          ? event.checked
          : this.selectedSubgroupKeys().has(this.buildSubgroupKey(groupId, subgroup.identifierSubGroup)),
      );

      this.selectedGroupIds.update((current) => {
        const next = new Set(current);
        allChecked ? next.add(groupId) : next.delete(groupId);
        return next;
      });
    }

    this.selectGroup.emit({ id: `${groupId}:${subGroupId}`, checked: event.checked });
  }

  protected toggleGroupExpansion(groupId: number): void {
    this.expandedGroupIds.update((current) => {
      const next = new Set(current);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  }

  protected isGroupExpanded(groupId: number): boolean {
    return this.expandedGroupIds().has(groupId);
  }

  protected isGroupChecked(group: GrupoTreeNode): boolean {
    if (!group.subgroups.length) {
      return this.selectedGroupIds().has(group.identifierGroup);
    }

    const keys = this.selectedSubgroupKeys();
    return group.subgroups.every((subgroup) =>
      keys.has(this.buildSubgroupKey(group.identifierGroup, subgroup.identifierSubGroup)),
    );
  }

  protected isGroupIndeterminate(group: GrupoTreeNode): boolean {
    if (!group.subgroups.length) return false;
    const keys = this.selectedSubgroupKeys();
    let selectedSubgroupCount = 0;
    for (const subgroup of group.subgroups) {
      if (keys.has(this.buildSubgroupKey(group.identifierGroup, subgroup.identifierSubGroup))) {
        selectedSubgroupCount++;
      }
    }
    return selectedSubgroupCount > 0 && selectedSubgroupCount < group.subgroups.length;
  }

  protected isSubgroupChecked(groupId: number, subGroupId: number): boolean {
    return this.selectedSubgroupKeys().has(this.buildSubgroupKey(groupId, subGroupId));
  }

  protected getSelectedVehicleCount(group: GrupoTreeNode): number {
    const map = this.filteredVehicleCountMap();
    let count = map.get(group.identifierGroup) ?? 0;
    for (const subgroup of group.subgroups) {
      count += map.get(subgroup.identifierSubGroup) ?? 0;
    }
    return count;
  }

  protected getGroupChevron(group: GrupoTreeNode): string {
    if (!group.subgroups.length) return 'chevron_right';
    return this.isGroupExpanded(group.identifierGroup) ? 'expand_more' : 'chevron_right';
  }

  protected isVehicleSelected(vehicleId: number): boolean {
    return this.selectedVehicleId() === vehicleId;
  }

  protected toggleVehicleSelection(vehicle: Vehicles): void {
    const current = this.selectedVehicleId();
    this.selectedVehicleId.set(current === vehicle.id ? null : vehicle.id);
  }

  protected applyVehicleSelection(): void {
    const payload = this.resolveApplyPayload(this.filteredVehiclesPerGroup());
    if (payload !== undefined) {
      this.selectVehicle.emit(payload);
    }
  }

  protected cancelVehicleSelection(): void {
    this.closeMenu.emit();
  }

  protected stopEventPropagation(event: Event): void {
    event.stopPropagation();
  }

  private resolveApplyPayload(vehicles: Vehicles[]): VeiculosMenuApplyEvent | null | undefined {
    const selectedVehicleId = this.selectedVehicleId();
    if (!selectedVehicleId) return undefined;

    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
    return selectedVehicle
      ? { id: selectedVehicle.id, displayText: selectedVehicle.displayText }
      : null;
  }

  private buildSubgroupKey(groupId: number, subGroupId: number): string {
    return `${groupId}:${subGroupId}`;
  }
}
