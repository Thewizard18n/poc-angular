import { ChangeDetectionStrategy, Component, input, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-periodo-filter',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatNativeDateModule,
  ],
  templateUrl: './periodo-filter.html',
  styleUrl: './periodo-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodoFilter {
  private readonly rangePicker = viewChild<MatDateRangePicker<Date>>('rangePicker');

  readonly dataInicio = input.required<Date | null>();
  readonly dataFim = input.required<Date | null>();

  readonly dataInicioChange = output<Date | null>();
  readonly dataFimChange = output<Date | null>();
  readonly dataCancel = output<void>();
  readonly dataApply = output<void>();
  protected draftDataInicio: Date | null = null;
  protected draftDataFim: Date | null = null;

  getLabel(): string {
    const inicio = this.dataInicio();
    const fim = this.dataFim();
    if (!inicio || !fim) {
      return 'Periodo';
    }

    return `${this.formatDate(inicio)} - ${this.formatDate(fim)}`;
  }

  hasRange(): boolean {
    return !!this.dataInicio() && !!this.dataFim();
  }

  openPicker(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.draftDataInicio = this.dataInicio();
    this.draftDataFim = this.dataFim();
    queueMicrotask(() => this.rangePicker()?.open());
  }

  onCancel(): void {
    this.draftDataInicio = this.dataInicio();
    this.draftDataFim = this.dataFim();
  }

  onApply(): void {
    this.dataInicioChange.emit(this.draftDataInicio);
    this.dataFimChange.emit(this.draftDataFim);
    this.dataApply.emit();
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }
}
