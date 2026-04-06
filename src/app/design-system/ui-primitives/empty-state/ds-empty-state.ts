import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'ds-empty-state',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './ds-empty-state.html',
  styleUrl: './ds-empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsEmptyState {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly icon = input<string>('inbox');
}
