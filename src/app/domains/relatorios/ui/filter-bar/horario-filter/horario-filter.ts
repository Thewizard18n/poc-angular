import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';


@Component({
  selector: 'app-horario-filter',
  imports: [ FormsModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './horario-filter.html',
  styleUrl: './horario-filter.scss',
})
export class HorarioFilter {
  readonly horarioInicio = input.required<string>();
  readonly horarioFim = input.required<string>();

  readonly horarioInicioChange = output<string>();
  readonly horarioFimChange = output<string>();
  protected draftHorarioInicio = '';
  protected draftHorarioFim = '';

  getLabel(): string {
    const inicio = this.horarioInicio();
    const fim = this.horarioFim();
    if (!inicio || !fim) {
      return 'Horario';
    }

    return `${inicio} - ${fim}`;
  }

  onMenuOpened(): void {
    this.draftHorarioInicio = this.horarioInicio();
    this.draftHorarioFim = this.horarioFim();
  }

  onCancel(): void {
    this.draftHorarioInicio = this.horarioInicio();
    this.draftHorarioFim = this.horarioFim();
  }

  onApply(): void {
    this.horarioInicioChange.emit(this.draftHorarioInicio);
    this.horarioFimChange.emit(this.draftHorarioFim);
  }
}
