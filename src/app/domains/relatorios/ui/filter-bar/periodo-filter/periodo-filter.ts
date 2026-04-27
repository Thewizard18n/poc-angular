import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { DateRange, DefaultMatCalendarRangeStrategy, MatCalendar, MatDatepickerModule, MatRangeDateSelectionModel } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-periodo-filter',
  imports: [
    MatButtonModule,
    MatCalendar,
    MatIconModule,
    MatMenuModule,
    MatNativeDateModule,
    MatCardModule,
    MatDatepickerModule
  ],
  providers: [DatePipe, DefaultMatCalendarRangeStrategy , MatRangeDateSelectionModel],
  templateUrl: './periodo-filter.html',
  styleUrl: './periodo-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodoFilter {

  private readonly menu = viewChild<MatMenuTrigger>('MatMenuTrigger');
  private static readonly MAX_RANGE_DAYS = 31;
  private static readonly DAY_IN_MS = 24 * 60 * 60 * 1000;
  private readonly datePipe = inject(DatePipe);

  readonly periodoApply = output<{ dateFrom: string | null; dateTo: string | null }>();
  protected dataInicio: Date | null = null
  protected dataFim: Date | null = null;

  protected draftStart = signal<Date | null>(null);
  protected draftEnd = signal<Date | null>(null);
  protected hasInvalidRange = signal(false);

  protected get selectedRange(): DateRange<Date> {
    return new DateRange<Date>(this.draftStart(), this.draftEnd());
  }

  getLabel(): string {
    if (!this.dataInicio || !this.dataFim) return 'Período';
    return `${this.formatDate(this.dataInicio)} - ${this.formatDate(this.dataFim)}`;
  }

  hasRange(): boolean {
    return !!this.dataInicio && !!this.dataFim;
  }

  onMenuOpen(): void {
    this.draftStart.set(this.dataInicio);
    this.draftEnd.set(this.dataFim);
    this.hasInvalidRange.set(false);
  }

  onSelectedChange(date: Date): void {
    const start = this.draftStart();
    const end = this.draftEnd();
    let nextStart: Date | null;
    let nextEnd: Date | null;

    if (!start || (start && end)) {
      nextStart = date;
      nextEnd = null;
      this.draftStart.set(nextStart);
      this.draftEnd.set(nextEnd);
      this.hasInvalidRange.set(false);
      return;
    }

    if (date < start) {
      nextStart = date;
      nextEnd = start;
    } else {
      nextStart = start;
      nextEnd = date;
    }

    this.draftStart.set(nextStart);
    this.draftEnd.set(nextEnd);
    this.hasInvalidRange.set(this.isRangeLongerThanAllowed(nextStart, nextEnd));
  }

  onCancel(): void {
    this.draftStart.set(this.dataInicio);
    this.draftEnd.set(this.dataFim);
    this.hasInvalidRange.set(false);
    this.menu()?.closeMenu();
  }

  onApply(): void {
    const start = this.draftStart();
    const end = this.draftEnd();

    if (this.isRangeLongerThanAllowed(start, end)) {
      this.hasInvalidRange.set(true);
      return;
    }

    this.hasInvalidRange.set(false);
    this.dataInicio = start;
    this.dataFim = end;

    this.periodoApply.emit({
      dateFrom: this.datePipe.transform(start, 'yyyy-MM-dd'),
      dateTo: this.datePipe.transform(end, 'yyyy-MM-dd'),
    });

    this.menu()?.closeMenu();
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }

  private isRangeLongerThanAllowed(inicio: Date | null, fim: Date | null): boolean {
    if (!inicio || !fim) return false;
    const a = new Date(inicio); a.setHours(0, 0, 0, 0);
    const b = new Date(fim); b.setHours(0, 0, 0, 0);
    const diff = Math.abs(b.getTime() - a.getTime()) / PeriodoFilter.DAY_IN_MS;
    return diff > PeriodoFilter.MAX_RANGE_DAYS;
  }
}