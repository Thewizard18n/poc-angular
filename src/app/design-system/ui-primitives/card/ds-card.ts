import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'ds-card',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './ds-card.html',
  styleUrl: './ds-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsCard {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
}
