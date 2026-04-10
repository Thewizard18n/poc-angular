import { Component, input, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';


@Component({
  selector: 'app-horario-filter',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule],
  templateUrl: './horario-filter.html',
  styleUrl: './horario-filter.scss',
})
export class HorarioFilter {
  private readonly horarioMenuTrigger = viewChild<MatMenuTrigger>('horarioMenuTrigger');

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

  hasAppliedRange(): boolean {
    return !!this.horarioInicio() && !!this.horarioFim();
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
    this.horarioMenuTrigger()?.closeMenu();
  }
}
