import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, computed, DestroyRef, inject, output, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { VeiculoFilterRepository } from '../../../data-access';
import { VeiculoFilterGrupoModel, VeiculoFilterVehicleModel } from './veiculo-filter.models';
import { VeiculosMenu, VeiculosMenuApplyEvent, VeiculosMenuCheckboxChangeEvent } from './veiculos-menu/veiculos-menu';

@Component({
  selector: 'app-veiculo-filter',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, VeiculosMenu],
  templateUrl: './veiculo-filter.html',
  styleUrl: './veiculo-filter.scss',
})
export class VeiculoFilter {
  private readonly veiculoMenuTrigger = viewChild<MatMenuTrigger>('veiculoMenuTrigger');
  private readonly repository = inject(VeiculoFilterRepository);
  private readonly destroyRef = inject(DestroyRef);

  readonly veiculoApply = output<{ id: string; displayText: string } | null>();

  private readonly allGrupos = signal<VeiculoFilterGrupoModel[]>([]);
  protected readonly allVehicles = signal<VeiculoFilterVehicleModel[]>([]);
  private readonly activeFilterIds = signal<Set<number>>(new Set());
  private readonly selectedVehicleLabel = signal<string | null>(null);
  protected readonly automotorChecked = signal(true);
  protected readonly naoAutomotorChecked = signal(true);
  private readonly grupoSearchTerm = signal('');
  private readonly veiculoSearchTerm = signal('');

  // O(1) lookup for subGroupIds by groupId
  private readonly subGroupsByGroup = computed(() => {
    const map = new Map<number, Set<number>>();
    for (const g of this.allGrupos()) {
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

  // O(N * M) — N=flat grupo entries, M=search term length
  protected readonly filteredGrupos = computed(() => {
    const all = this.allGrupos();
    const automotor = this.automotorChecked();
    const naoAutomotor = this.naoAutomotorChecked();
    const search = this.grupoSearchTerm().trim().toLowerCase();

    if (!automotor && !naoAutomotor) return [];

    let result = all;

    if (!automotor || !naoAutomotor) {
      const tipo = automotor ? 1 : 0;
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

  // O(V * K) — V=vehicles, K=avg groups per vehicle
  protected readonly filteredVehicles = computed(() => {
    const ids = this.activeFilterIds();
    if (ids.size === 0) return [];

    const search = this.veiculoSearchTerm().trim().toLowerCase();

    return this.allVehicles().filter((v) => {
      if (!v.groups.some((g) => ids.has(g))) return false;
      if (search && !v.displayText.toLowerCase().includes(search)) return false;
      return true;
    });
  });

  constructor() {
    this.carregarDados();
  }

  getLabel(): string {
    return this.selectedVehicleLabel() ?? 'Veículo';
  }

  protected onTipoToggleChange(event: { toggleId: number; checked: boolean }): void {
    if (event.toggleId === 1) {
      this.automotorChecked.set(event.checked);
    } else {
      this.naoAutomotorChecked.set(event.checked);
    }
  }

  protected onSearchChange(event: { source: 'grupos' | 'veiculos'; value: string }): void {
    if (event.source === 'grupos') {
      this.grupoSearchTerm.set(event.value);
    } else {
      this.veiculoSearchTerm.set(event.value);
    }
  }

  protected onCheckboxChange(event: VeiculosMenuCheckboxChangeEvent): void {
    const parts = event.id.split(':');

    if (parts.length === 2) {
      const subGroupId = Number(parts[1]);
      this.activeFilterIds.update((current) => {
        const next = new Set(current);
        event.checked ? next.add(subGroupId) : next.delete(subGroupId);
        return next;
      });
      return;
    }

    const groupId = Number(parts[0]);
    const subGroupIds = this.subGroupsByGroup().get(groupId);

    this.activeFilterIds.update((current) => {
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

  protected onConfirmarSelecao(vehicle: VeiculosMenuApplyEvent | null): void {
    if (vehicle) {
      this.selectedVehicleLabel.set(vehicle.displayText);
      this.veiculoApply.emit({ id: vehicle.id.toString(), displayText: vehicle.displayText });
    } else {
      this.selectedVehicleLabel.set(null);
      this.veiculoApply.emit(null);
    }
    this.veiculoMenuTrigger()?.closeMenu();
  }

  protected onCancelarSelecao(): void {
    this.veiculoMenuTrigger()?.closeMenu();
  }

  private carregarDados(): void {
    this.repository
      .getGrupos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.allGrupos.set(Array.isArray(response) ? response : []);
      });

    this.repository
      .getVehicles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.allVehicles.set(Array.isArray(response) ? response : []);
      });
  }
}
