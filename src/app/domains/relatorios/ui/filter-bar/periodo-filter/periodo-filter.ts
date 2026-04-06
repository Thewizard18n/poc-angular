import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { DsDateRangeMenuField } from '../../../../../design-system/ui-patterns/date-range-menu-field/ds-date-range-menu-field';

@Component({
  selector: 'app-periodo-filter',
  imports: [DsDateRangeMenuField],
  templateUrl: './periodo-filter.html',
  styleUrl: './periodo-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodoFilter {
  readonly dataInicio = input.required<Date | null>();
  readonly dataFim = input.required<Date | null>();

  readonly dataInicioChange = output<Date | null>();
  readonly dataFimChange = output<Date | null>();
  readonly dataCancel = output<void>();
  readonly dataApply = output<void>();
}
