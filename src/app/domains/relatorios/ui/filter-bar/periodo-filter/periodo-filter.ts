import { ChangeDetectionStrategy, Component, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-periodo-filter',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatNativeDateModule,
    MatMenuModule,
  ],
  templateUrl: './periodo-filter.html',
  styleUrl: './periodo-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodoFilter {
  private readonly rangePicker = viewChild<MatDateRangePicker<Date>>('rangePicker');

  readonly periodoApply = output<{ dateFrom: Date | null; dateTo: Date | null }>();
  readonly dataCancel = output<void>();
  protected dataInicio: Date | null = null;
  protected dataFim: Date | null = null;
  protected draftDataInicio: Date | null = null;
  protected draftDataFim: Date | null = null;

  getLabel(): string {
    const inicio = this.dataInicio;
    const fim = this.dataFim;
    if (!inicio || !fim) {
      return 'Periodo';
    }

    return `${this.formatDate(inicio)} - ${this.formatDate(fim)}`;
  }

  hasRange(): boolean {
    return !!this.dataInicio && !!this.dataFim;
  }

  openPicker(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.draftDataInicio = this.dataInicio;
    this.draftDataFim = this.dataFim;
    queueMicrotask(() => this.rangePicker()?.open());
  }

  onCancel(): void {
    this.draftDataInicio = this.dataInicio;
    this.draftDataFim = this.dataFim;
  }

  onApply(): void {
    this.dataInicio = this.draftDataInicio;
    this.dataFim = this.draftDataFim;
    this.periodoApply.emit({
      dateFrom: this.draftDataInicio,
      dateTo: this.draftDataFim,
    });
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }
}
