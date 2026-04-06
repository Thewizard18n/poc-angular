import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-veiculo-filter',
  imports: [MatButtonModule, MatCheckboxModule, MatIconModule, MatMenuModule],
  templateUrl: './veiculo-filter.html',
  styleUrl: './veiculo-filter.scss',
})
export class VeiculoFilter {
  readonly veiculosDisponiveis = input.required<string[]>();
  readonly veiculosSelecionados = input.required<string[]>();

  readonly veiculoToggle = output<string>();

  getLabel(): string {
    const selecionados = this.veiculosSelecionados();
    if (!selecionados.length) {
      return 'Veiculo';
    }

    return selecionados.join(', ');
  }

  onToggleVeiculo(event: Event, veiculo: string): void {
    event.stopPropagation();
    this.veiculoToggle.emit(veiculo);
  }
}
