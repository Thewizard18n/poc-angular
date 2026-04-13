import { Component, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTimepickerModule } from '@angular/material/timepicker';

@Component({
  selector: 'app-horario-filter',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatNativeDateModule,
    MatTimepickerModule,
  ],
  templateUrl: './horario-filter.html',
  styleUrl: './horario-filter.scss',
})
export class HorarioFilter {
  private readonly horarioMenuTrigger = viewChild<MatMenuTrigger>('horarioMenuTrigger');

  readonly horarioApply = output<{ timeFrom: string; timeTo: string }>();
  protected horarioInicio = '';
  protected horarioFim = '';
  protected draftHorarioInicio: Date | null = null;
  protected draftHorarioFim: Date | null = null;

  getLabel(): string {
    const inicio = this.horarioInicio;
    const fim = this.horarioFim;
    if (!inicio || !fim) {
      return 'Horario';
    }

    return `${inicio} - ${fim}`;
  }

  hasAppliedRange(): boolean {
    return !!this.horarioInicio && !!this.horarioFim;
  }

  onMenuOpened(): void {
    this.draftHorarioInicio = this.stringToDate(this.horarioInicio);
    this.draftHorarioFim = this.stringToDate(this.horarioFim);
  }

  onCancel(): void {
    this.draftHorarioInicio = this.stringToDate(this.horarioInicio);
    this.draftHorarioFim = this.stringToDate(this.horarioFim);
  }

  onApply(): void {
    this.horarioInicio = this.dateToString(this.draftHorarioInicio);
    this.horarioFim = this.dateToString(this.draftHorarioFim);
    this.horarioApply.emit({
      timeFrom: this.horarioInicio,
      timeTo: this.horarioFim,
    });
    this.horarioMenuTrigger()?.closeMenu();
  }

  private dateToString(date: Date | null): string {
    if (!date) {
      return '';
    }

    const hora = date.getHours().toString().padStart(2, '0');
    const minuto = date.getMinutes().toString().padStart(2, '0');
    return `${hora}:${minuto}`;
  }

  private stringToDate(valor: string): Date | null {
    if (/^\d{2}:\d{2}$/.test(valor)) {
      const [hora, minuto] = valor.split(':');
      const parsed = new Date();
      parsed.setHours(Number(hora), Number(minuto), 0, 0);
      return parsed;
    }

    return null;
  }
}
