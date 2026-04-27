import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, computed, DestroyRef, inject, OnInit, output, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { VeiculoFilterRepository } from '../../../data-access';
import { Veiculo } from './veiculo.enum';
import { Groups, Vehicles } from './veiculo-filter.models';
import { VeiculosMenu, VeiculosMenuApplyEvent, VeiculosMenuCheckboxChangeEvent } from './veiculos-menu/veiculos-menu';

@Component({
  selector: 'app-veiculo-filter',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, VeiculosMenu],
  templateUrl: './veiculo-filter.html',
  styleUrl: './veiculo-filter.scss',
})
export class VeiculoFilter implements OnInit {
  protected readonly allVehicles = signal<Vehicles[]>([]);
  protected readonly automotorChecked = signal(true);
  protected readonly naoAutomotorChecked = signal(true);
  private readonly availableGroups = computed(() => {
    const groups = this.allGroups();
    const vehicleGroupIds = new Set(this.allVehicles().flatMap((vehicle) => vehicle.groups));

    return groups.filter((group) => {
      if (group.identifierSubGroup !== -1) {
        return vehicleGroupIds.has(group.identifierSubGroup);
      }

      return (
        vehicleGroupIds.has(group.identifierGroup) ||
        groups.some(
          (subGroup) =>
            subGroup.identifierGroup === group.identifierGroup &&
            subGroup.identifierSubGroup !== -1 &&
            vehicleGroupIds.has(subGroup.identifierSubGroup),
        )
      );
    });
  });
  protected readonly filteredGrupos = computed(() => {
    const all = this.availableGroups();
    const automotor = this.automotorChecked();
    const naoAutomotor = this.naoAutomotorChecked();
    const search = this.groupSearch().trim().toLowerCase();

    if (!automotor && !naoAutomotor) return [];

    let result = all;

    if (!automotor || !naoAutomotor) {
      const tipo = automotor ? Veiculo.Automotor : Veiculo.NaoAutomotor;
      result = result.filter((g) => g.auto === tipo);
    }

    if (search) {
      result = result.filter(
        (g) =>
          g.nameGroup.toLowerCase().includes(search) ||
          (g.nameSubGroup?.toLowerCase().includes(search) ?? false),
      );
    }

    return result;
  });
  protected readonly filteredVehicles = computed(() => {
    const ids = this.selectedGroupsIds();
    if (ids.size === 0) return [];

    const search = this.vehicleSearch().trim().toLowerCase();

    return this.allVehicles().filter((v) => {
      if (!v.groups.some((g) => ids.has(g))) return false;
      if (search && !v.displayText.toLowerCase().includes(search)) return false;
      return true;
    });
  });

  readonly vehicleApplyFilter = output<{ id: number }>();

  private readonly vehicleMenuTrigger = viewChild<MatMenuTrigger>('vehicleMenuTrigger');
  private readonly repository = inject(VeiculoFilterRepository);
  private readonly destroyRef = inject(DestroyRef);
  private readonly groupSearch = signal('');
  private readonly vehicleSearch = signal('');
  private readonly allGroups = signal<Groups[]>([]);
  private readonly selectedVehicleLabel = signal<string | null>(null);

  private readonly selectedGroupsIds = signal<Set<number>>(new Set());

  private readonly subGroupsByGroup = computed(() => {
    const map = new Map<number, Set<number>>();
    for (const g of this.allGroups()) {
      if (g.identifierSubGroup === -1) continue;
      let set = map.get(g.identifierGroup);
      if (!set) {
        set = new Set();
        map.set(g.identifierGroup, set);
      }
      set.add(g.identifierSubGroup);
    }
    return map;
  });

  ngOnInit(): void {
    this.loadGroups();
    this.loadVehicles();
  }

  getLabel(): string {
    return this.selectedVehicleLabel() ?? 'Veículo';
  }

  protected typeVehicleFilter(event: { toggleId: number; checked: boolean }): void {
    if (event.toggleId === 1) {
      this.automotorChecked.set(event.checked);
      return;
    }
    this.naoAutomotorChecked.set(event.checked);
  }

  protected searchToFilter(event: { source: 'grupos' | 'veiculos'; value: string }): void {
    if (event.source === 'grupos') {
      this.groupSearch.set(event.value);
      return;
    }
    this.vehicleSearch.set(event.value);
  }

  protected updateSelectedGroups(event: VeiculosMenuCheckboxChangeEvent): void {
    const parts = event.id.split(':');

    if (parts.length === 2) {
      const subGroupId = Number(parts[1]);
      this.selectedGroupsIds.update((current) => {
        const next = new Set(current);
        event.checked ? next.add(subGroupId) : next.delete(subGroupId);
        return next;
      });
      return;
    }

    const groupId = Number(parts[0]);
    const subGroupIds = this.subGroupsByGroup().get(groupId);

    this.selectedGroupsIds.update((current) => {
      const next = new Set(current);
      if (subGroupIds && subGroupIds.size > 0) {
        for (const sgId of subGroupIds) {
          event.checked ? next.add(sgId) : next.delete(sgId);
        }
      } else {
        event.checked ? next.add(groupId) : next.delete(groupId);
      }
      return next;
    });
  }

  protected selectVehicle(vehicle: VeiculosMenuApplyEvent | null): void {
    this.selectedVehicleLabel.set(vehicle?.displayText ?? null);
    this.vehicleApplyFilter.emit({ id: vehicle?.id ?? 0 });
    this.vehicleMenuTrigger()?.closeMenu();
  }

  private loadGroups(): void {
    this.repository
      .getGrupos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.allGroups.set(Array.isArray(response) ? response : []);
      });
  }

  private loadVehicles(): void {
    this.repository
      .getVehicles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.allVehicles.set(Array.isArray(response) ? response : []);
      });
  }
}
