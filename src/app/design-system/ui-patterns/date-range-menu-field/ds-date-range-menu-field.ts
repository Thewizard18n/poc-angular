import { ChangeDetectionStrategy, Component, input, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'ds-date-range-menu-field',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatNativeDateModule,
  ],
  templateUrl: './ds-date-range-menu-field.html',
  styleUrl: './ds-date-range-menu-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsDateRangeMenuField {
  private readonly rangePicker = viewChild<MatDateRangePicker<Date>>('rangePicker');

  readonly startDate = input.required<Date | null>();
  readonly endDate = input.required<Date | null>();
  readonly fallbackLabel = input<string>('Periodo');

  readonly startDateChange = output<Date | null>();
  readonly endDateChange = output<Date | null>();
  readonly cancel = output<void>();
  readonly apply = output<void>();

  protected getLabel(): string {
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) {
      return this.fallbackLabel();
    }

    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  }

  protected openPicker(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    queueMicrotask(() => this.rangePicker()?.open());
  }

  protected closePicker(): void {
    this.rangePicker()?.close();
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }
}
