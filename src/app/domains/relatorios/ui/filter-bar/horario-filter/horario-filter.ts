import {
  ChangeDetectionStrategy,
  Component,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';

@Component({
  selector: 'app-horario-filter',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatTimepickerModule,
  ],
  templateUrl: './horario-filter.html',
  styleUrl: './horario-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioFilter {
  private readonly menu = viewChild<MatMenuTrigger>('MatMenuTrigger');

  readonly horarioApply = output<{ timeFrom: string; timeTo: string }>();

  private appliedInicio: Date = new Date(0, 0, 0, 0, 0);
  private appliedFim: Date = new Date(0, 0, 0, 23, 59);

  protected hasAppliedRange = signal(false);
  protected readonly maxTime = new Date(0, 0, 0, 23, 59);

  protected form = new FormGroup({
    inicio: new FormControl<Date | null>(new Date(0, 0, 0, 0, 0), { validators: [Validators.required] }),
    fim: new FormControl<Date | null>(new Date(0, 0, 0, 23, 59), { validators: [Validators.required] }),
  });

  getLabel(): string {
    if (!this.hasAppliedRange()) return 'Horário';
    return `${this.formatTime(this.appliedInicio)} - ${this.formatTime(this.appliedFim)}`;
  }

  onMenuOpened(): void {
    this.form.setValue({
      inicio: this.appliedInicio,
      fim: this.appliedFim,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  onCancel(): void {
    this.form.setValue({
      inicio: this.appliedInicio,
      fim: this.appliedFim,
    });
    this.menu()?.closeMenu();
  }

  onApply(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.appliedInicio = this.form.value.inicio!;
    this.appliedFim = this.form.value.fim!;
    this.hasAppliedRange.set(true);

    this.horarioApply.emit({
      timeFrom: this.formatTime(this.appliedInicio),
      timeTo: this.formatTime(this.appliedFim),
    });

    this.menu()?.closeMenu();
  }

  private formatTime(date: Date): string {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}